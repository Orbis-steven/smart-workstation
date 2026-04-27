// @ts-nocheck
import React from 'react';
const { useEffect, useMemo, useRef, useState } = React;
import axios from 'axios';
import { CMessageBox, PTable } from 'orbcafe-ui';
import SmartWorkStation from './SmartWorkStation';
import { INVENTORY_DATA_PROVIDER, WORKSTATION_API_URL } from './config/api';
import { ManualPickModal } from './components/sap-order/ManualPickModal';
import { TransferModal } from './components/sap-order/TransferModal';
import { SearchFilters } from './components/sap-order/SearchFilters';
import { VoiceAssistantPanel } from './components/sap-order/VoiceAssistantPanel';
import { QueuePanel } from './components/sap-order/QueuePanel';
import { BottomActionBar } from './components/sap-order/BottomActionBar';
import { JobConfirmContent } from './components/sap-order/JobConfirmContent';
import { buildSapOrderColumns } from './components/sap-order/tableColumns.jsx';
import { sapOrderDict } from './i18n/sapOrderDict';
import { formatMessage } from './i18n/formatMessage';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import {
  buildModulaJobs,
  completeProcessingJob,
  getQueueSummary,
  isSapRowDisabled,
  scheduleModulaQueue,
} from './modules/modula/queueService';
import {
  createInitialItemLocationMapping,
  createInitialMockSapOrders,
  createInitialTrayInventorySnapshot,
} from './modules/sap/mockRepository';
import {
  buildItemLocationRows,
  buildTrayInventoryRows,
  queryOpenTaskRows,
  SAP_QUERY_MODES,
  syncInventorySnapshotWithOrders,
} from './modules/sap/sapTaskService';
import { updateMaterialLocation } from './modules/sap/sapUpdateService';
import {
  buildVoiceSearchSummary,
  describeSearchFilters,
  parseVoiceCommand,
} from './modules/sap/voiceCommandService';
import { getItemLocationByItemNo } from './modules/sap/sapInventoryService';
import { getGridPositionFromBin, normalizeBinId, normalizeTrayId } from './modules/modula/trayNaming';

export default function SapOrderPage({ locale = 'zh', theme = 'light' }) {
  const t = (key, params = {}) => formatMessage(sapOrderDict, locale, key, params);

  const [msgOpen, setMsgOpen] = useState(false);
  const [msgTitle, setMsgTitle] = useState('操作确认');
  const [msgContent, setMsgContent] = useState('');
  const [isConfirmingJob, setIsConfirmingJob] = useState(false);
  const [confirmJobData, setConfirmJobData] = useState(null);
  const [extraSelectedIds, setExtraSelectedIds] = useState([]);

  const [selectedRows, setSelectedRows] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [trayInventoryInput, setTrayInventoryInput] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [lastQueryMode, setLastQueryMode] = useState(null);
  const jobQueueRef = useRef([]);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ itemNo: '', tray: '', bin: '' });
  const [transferLoading, setTransferLoading] = useState(false);

  const [localMockSapOrders, setLocalMockSapOrders] = useState(() => createInitialMockSapOrders());
  const [mockItemLocationMapping, setMockItemLocationMapping] = useState(() => createInitialItemLocationMapping());
  const [mockTrayInventorySnapshot, setMockTrayInventorySnapshot] = useState(() => createInitialTrayInventorySnapshot());

  const [jobQueue, setJobQueue] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);

  const [visionMode, setVisionMode] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [pendingVisionOpen, setPendingVisionOpen] = useState(false);
  const [showManualPickModal, setShowManualPickModal] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState('点击话筒后说出指令，例如：帮我查一下今天有哪些出库任务。');
  const [assistantTone, setAssistantTone] = useState('idle');

  const processedJobIds = useRef(new Set());

  const ordersByToNo = useMemo(() => localMockSapOrders, [localMockSapOrders]);
  const queueSummary = useMemo(() => getQueueSummary({ jobQueue, activeJobs }), [jobQueue, activeJobs]);
  const inboundSelectedCount = selectedRows.filter((row) => row.jobType === 'inbound').length;
  const outboundSelectedCount = selectedRows.filter((row) => row.jobType === 'outbound').length;

  const setAssistantFeedback = (message, tone = 'idle') => {
    setAssistantStatus(message);
    setAssistantTone(tone);
  };

  const speakAssistant = (message) => {
    if (!message || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : 'zh-CN';
    window.speechSynthesis.speak(utterance);
  };

  const {
    isListening: isAssistantListening,
    start: startVoiceAssistant,
    transcript: assistantTranscript,
  } = useSpeechRecognition({
    locale,
    onUnsupported: () => {
      const message = '当前浏览器不支持语音识别，请使用 Chrome 或 Edge。';
      setAssistantFeedback(message, 'error');
      speakAssistant(message);
    },
    onStart: () => setAssistantFeedback('正在听，请直接说出指令。', 'listening'),
    onError: (error) => {
      const errorMessage = error === 'not-allowed'
        ? '语音权限被拒绝，请先允许浏览器访问麦克风。'
        : error === 'no-speech'
          ? '没有检测到说话内容，请再试一次。'
          : `语音识别失败：${error}`;
      setAssistantFeedback(errorMessage, 'error');
      speakAssistant(errorMessage);
    },
    onTranscript: async (transcript) => {
      if (!transcript) {
        setAssistantFeedback('没有识别到有效语音，请重试。', 'warning');
        speakAssistant('没有识别到有效语音，请重试。');
        return;
      }
      await executeVoiceCommand(transcript);
    },
  });

  const fetchData = async (filters) => {
    setLoading(true);
    try {
      const itemNoFilter = String(filters?.itemNo || '').trim();
      const trayInventoryFilter = String(filters?.trayInventory || '').trim();

      if (trayInventoryFilter) {
        setLastQueryMode(SAP_QUERY_MODES.TRAY_INVENTORY);
        const data = await buildTrayInventoryRows({
          trayId: trayInventoryFilter,
          provider: INVENTORY_DATA_PROVIDER,
          inventorySnapshot: mockTrayInventorySnapshot,
        });
        setRows(data);
        setSelectedRows([]);
        setPagination((prev) => ({ ...prev, total: data.length }));
        return data;
      }

      if (itemNoFilter) {
        setLastQueryMode(SAP_QUERY_MODES.ITEM_LOCATION);
        let record = await getItemLocationByItemNo({
          itemNo: itemNoFilter,
          provider: INVENTORY_DATA_PROVIDER,
          itemLocationMapping: mockItemLocationMapping,
        }).catch(() => null);

        if (!record) {
          const response = await axios.get(`${WORKSTATION_API_URL}/item-location`, { params: { item_no: itemNoFilter } }).catch(() => null);
          record = response?.data || null;
        }

        const data = buildItemLocationRows(record);
        setRows(data);
        setSelectedRows([]);
        setPagination((prev) => ({ ...prev, total: data.length }));
        return data;
      }

      setLastQueryMode(SAP_QUERY_MODES.TASKS);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const data = await queryOpenTaskRows({
        filters,
        provider: INVENTORY_DATA_PROVIDER,
        orders: localMockSapOrders,
      });

      setRows(data);
      setPagination((prev) => ({ ...prev, total: data.length }));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (newValues, options = {}) => {
    setSelectedRows([]);
    setShowVisionModal(false);
    setPendingVisionOpen(false);

    const finalFilters = newValues || filterValues;
    setFilterValues(finalFilters);
    setTrayInventoryInput(finalFilters.trayInventory || '');
    const data = await fetchData(finalFilters);

    if (options?.announce) {
      const summary = buildVoiceSearchSummary(data || [], finalFilters);
      setAssistantFeedback(summary, data?.length ? 'success' : 'warning');
      speakAssistant(summary);
    }

    return data;
  };

  const isRowDisabled = (row) => isSapRowDisabled({ row, ordersByToNo, jobQueue });

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRows(rows.filter((row) => !isRowDisabled(row)));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (row, checked) => {
    if (isRowDisabled(row)) {
      return;
    }

    if (checked) {
      setSelectedRows((prev) => [...prev, row]);
    } else {
      setSelectedRows((prev) => prev.filter((selectedRow) => selectedRow.id !== row.id));
    }
  };

  const columns = useMemo(() => buildSapOrderColumns({
    t,
    locale,
    rows,
    selectedRows,
    isRowDisabled,
    handleSelectAll,
    handleSelectRow,
    ordersByToNo,
    jobQueue,
    lastQueryMode,
  }), [locale, rows, selectedRows, ordersByToNo, jobQueue, lastQueryMode]);

  const openTransferModal = () => {
    const row = rows.find((record) => record.isLocationQuery);
    if (!row) {
      setMsgTitle('库位转移');
      setMsgContent('请先通过物料号查询到库位结果后再进行库位转移。');
      setMsgOpen(true);
      return;
    }

    setTransferForm({
      itemNo: row.itemNo,
      tray: row.tray || '',
      bin: row.bin || '',
    });
    setShowTransferModal(true);
  };

  const handleTransferConfirm = async () => {
    const tray = normalizeTrayId(transferForm.tray);
    const bin = normalizeBinId(transferForm.bin, tray);
    const position = getGridPositionFromBin(bin, tray);
    const binTray = normalizeTrayId(String(bin || '').split('M')[0]);

    if (!transferForm.itemNo || !tray || !bin || !position.x || !position.y) {
      setMsgTitle('库位转移');
      setMsgContent('请输入有效的 Tray 和 Bin。');
      setMsgOpen(true);
      return;
    }

    if (binTray && binTray !== tray) {
      setMsgTitle('库位转移');
      setMsgContent('Bin 必须属于待转入的 Tray。');
      setMsgOpen(true);
      return;
    }

    setTransferLoading(true);
    try {
      const result = await updateMaterialLocation({
        itemNo: transferForm.itemNo,
        tray,
        bin,
        provider: INVENTORY_DATA_PROVIDER,
        itemLocationMapping: mockItemLocationMapping,
        inventorySnapshot: mockTrayInventorySnapshot,
      });

      setMockItemLocationMapping(result.nextItemLocationMapping);
      setMockTrayInventorySnapshot(result.nextInventorySnapshot);

      const nextRows = buildItemLocationRows(result.record);
      setRows(nextRows);
      setPagination((prev) => ({ ...prev, total: nextRows.length }));
      setShowTransferModal(false);
      setMsgTitle('库位转移');
      setMsgContent('库位转移已记录。');
      setMsgOpen(true);
    } catch (error) {
      setMsgTitle('库位转移');
      setMsgContent(error.response?.data?.detail || '库位转移失败。');
      setMsgOpen(true);
    } finally {
      setTransferLoading(false);
    }
  };

  const executeVoiceCommand = async (rawText) => {
    const spokenText = String(rawText || '').trim();
    if (!spokenText) {
      setAssistantFeedback('没有识别到有效语音，请重试。', 'warning');
      speakAssistant('没有识别到有效语音，请重试。');
      return;
    }

    const command = parseVoiceCommand(spokenText);

    if (command.type === 'toggleVision') {
      setVisionMode(command.enabled);
      if (!command.enabled) {
        setVoicePrompt(false);
      }
      const message = command.enabled ? '已开启图像识别模式。' : '已关闭图像识别模式。';
      setAssistantFeedback(message, 'success');
      speakAssistant(message);
      return;
    }

    if (command.type === 'toggleVoicePrompt') {
      setVoicePrompt(command.enabled);
      const message = command.enabled ? '已开启语音提示。' : '已关闭语音提示。';
      setAssistantFeedback(message, 'success');
      speakAssistant(message);
      return;
    }

    if (command.type === 'clearSelection') {
      setSelectedRows([]);
      setAssistantFeedback('已取消当前选中的物料。', 'success');
      speakAssistant('已取消当前选中的物料。');
      return;
    }

    if (command.type === 'selectAll') {
      const selectableRows = rows.filter((row) => !isRowDisabled(row));
      setSelectedRows(selectableRows);
      const message = selectableRows.length
        ? `已为您全选 ${selectableRows.length} 个可操作物料。`
        : '当前没有可全选的物料。';
      setAssistantFeedback(message, selectableRows.length ? 'success' : 'warning');
      speakAssistant(message);
      return;
    }

    if (command.type === 'submitJob') {
      const actionLabel = command.jobType === 'outbound' ? '出库' : '入库';
      setAssistantFeedback(`正在为您发起${actionLabel}任务。`, 'listening');
      speakAssistant(`正在为您发起${actionLabel}任务。`);
      handleJob(command.jobType);
      return;
    }

    if (command.type === 'search') {
      const mergedFilters = {
        ...filterValues,
        ...command.filters,
      };

      if (!('trayInventory' in command.filters)) mergedFilters.trayInventory = '';
      if (!('itemNo' in command.filters)) mergedFilters.itemNo = '';
      if (!('jobType' in command.filters) && /任务|查询|查一下|查一查|筛选/.test(spokenText.replace(/\s+/g, ''))) delete mergedFilters.jobType;
      if (!('toNo' in command.filters)) mergedFilters.toNo = '';
      if (!('workOrderNo' in command.filters)) mergedFilters.workOrderNo = '';
      if (!('deliveryNo' in command.filters)) mergedFilters.deliveryNo = '';
      if (!('date' in command.filters)) mergedFilters.date = [];

      const announceText = `正在查询${describeSearchFilters(mergedFilters)}。`;
      setAssistantFeedback(announceText, 'listening');
      speakAssistant(announceText);
      await handleSearch(mergedFilters, { announce: true });
      return;
    }

    setAssistantFeedback('暂时无法理解这条语音指令，请换一种说法，例如“帮我查一下今天有哪些出库任务”。', 'warning');
    speakAssistant('暂时无法理解这条语音指令，请换一种说法。');
  };

  const handleJob = (type) => {
    const actionName = type === 'inbound' ? t('inbound') : t('outbound');
    const verbName = type === 'inbound' ? t('store') : t('pick');
    const relevantRows = selectedRows.filter((row) => row.jobType === type);

    if (relevantRows.length === 0) {
      setMsgTitle(t('promptTitle', { action: actionName }));
      setMsgContent(t('promptMsg', { verb: verbName }));
      setIsConfirmingJob(false);
      setMsgOpen(true);
      return;
    }

    const uniqueTOs = [...new Set(relevantRows.map((row) => row.toNo))];
    if (uniqueTOs.length > 1) {
      setMsgTitle(t('errorTitle', { action: actionName }));
      setMsgContent(t('errorMsg', { count: uniqueTOs.length, list: uniqueTOs.join(', ') }));
      setIsConfirmingJob(false);
      setConfirmJobData(null);
      setMsgOpen(true);
      return;
    }

    const currentToNo = relevantRows[0].toNo;
    if (jobQueue.length > 0) {
      const activeToNo = jobQueue[0].toNo;
      if (activeToNo !== currentToNo) {
        const activeToData = ordersByToNo[activeToNo];
        if (activeToData && activeToData.status !== 'completed') {
          setMsgTitle(t('errorTitle', { action: actionName }));
          setMsgContent(`当前正在处理 TO [${activeToNo}] 的指令队列，且该 TO 尚未完全处理结束。\n系统不允许交叉操作。请等待 [${activeToNo}] 处理完毕，或点击队列右上角的 × 关闭队列后再操作其他的 TO。`);
          setIsConfirmingJob(false);
          setConfirmJobData(null);
          setMsgOpen(true);
          return;
        }
      }
    }

    const trays = [...new Set(relevantRows.map((row) => row.tray || row.bin))];
    const allItemsInThisTo = rows.filter((row) => row.toNo === currentToNo && row.jobType === type);
    const unselectedItemsInSameTrays = allItemsInThisTo.filter((item) => {
      if (!trays.includes(item.tray || item.bin)) return false;
      if (relevantRows.some((row) => row.id === item.id)) return false;
      const isAlreadyDispatched = jobQueue.some((job) => job.toNo === currentToNo && job.itemIds?.includes(item.id));
      return !isAlreadyDispatched;
    });

    setConfirmJobData({
      relevantRows,
      actionName,
      verbName,
      bins: trays,
      unselectedItemsInSameBins: unselectedItemsInSameTrays,
      type,
    });
    setExtraSelectedIds([]);
    setIsConfirmingJob(true);
    setMsgOpen(true);
  };

  const handleConfirmJob = () => {
    setMsgOpen(false);
    if (!isConfirmingJob || !confirmJobData) {
      return;
    }

    const { relevantRows, unselectedItemsInSameBins, type } = confirmJobData;
    const extraRows = unselectedItemsInSameBins.filter((item) => extraSelectedIds.includes(item.id));
    const finalRowsToProcess = [...relevantRows, ...extraRows];
    const newJobs = buildModulaJobs(finalRowsToProcess, type);

    setJobQueue((prev) => {
      if (prev.length > 0 && prev[0].toNo !== finalRowsToProcess[0].toNo) {
        return [...newJobs];
      }
      return [...prev, ...newJobs];
    });

    const processedIds = finalRowsToProcess.map((row) => row.id);
    setSelectedRows((prev) => prev.filter((row) => !processedIds.includes(row.id)));
    setIsConfirmingJob(false);
    setConfirmJobData(null);
    setExtraSelectedIds([]);
    setPendingVisionOpen(visionMode);
  };

  const markProcessingJobCompleted = () => {
    setActiveJobs((previousActiveJobs) => {
      const result = completeProcessingJob({
        activeJobs: previousActiveJobs,
        jobQueue: jobQueueRef.current,
      });

      if (!result.completedJob) {
        return previousActiveJobs;
      }

      setJobQueue(result.nextJobQueue);
      setLocalMockSapOrders((prevOrders) => {
        const currentOrder = prevOrders[result.completedJob.toNo];
        if (!currentOrder) {
          return prevOrders;
        }

        const isFullyCompleted = currentOrder.items.every((item) => {
          const queueJob = result.nextJobQueue.find((job) => job.toNo === result.completedJob.toNo && job.itemIds?.includes(item.id));
          return queueJob && queueJob.status === 'completed';
        });

        if (!isFullyCompleted) {
          return prevOrders;
        }

        return {
          ...prevOrders,
          [result.completedJob.toNo]: {
            ...currentOrder,
            status: 'completed',
          },
        };
      });

      return result.nextActiveJobs;
    });
  };

  const currentProcessingJob = activeJobs.find((job) => job.status === 'processing') || jobQueue.find((job) => ['processing', 'pending', 'waiting'].includes(job.status));
  const pendingVisionItems = currentProcessingJob?.items || rows.filter((row) => currentProcessingJob?.itemIds?.includes(row.id));

  useEffect(() => {
    jobQueueRef.current = jobQueue;
  }, [jobQueue]);

  useEffect(() => {
    setMockTrayInventorySnapshot((prevSnapshot) => syncInventorySnapshotWithOrders({
      orders: localMockSapOrders,
      inventorySnapshot: prevSnapshot,
    }));
  }, [localMockSapOrders]);

  useEffect(() => {
    const { changed, nextJobQueue, nextActiveJobs } = scheduleModulaQueue({ jobQueue, activeJobs });
    if (!changed) {
      return;
    }

    setJobQueue(nextJobQueue);
    setActiveJobs(nextActiveJobs);
  }, [jobQueue, activeJobs]);

  useEffect(() => {
    if (visionMode || showVisionModal) {
      setShowManualPickModal(false);
      return;
    }

    const processingJob = activeJobs.find((job) => job.status === 'processing');
    if (processingJob && !showManualPickModal && !processedJobIds.current.has(processingJob.id)) {
      setShowManualPickModal(true);
    } else if (!processingJob && showManualPickModal) {
      setShowManualPickModal(false);
    }
  }, [activeJobs, showManualPickModal, showVisionModal, visionMode]);

  useEffect(() => {
    Array.from(processedJobIds.current).forEach((jobId) => {
      if (!activeJobs.some((job) => job.id === jobId)) {
        processedJobIds.current.delete(jobId);
      }
    });
  }, [activeJobs]);

  useEffect(() => {
    if (pendingVisionOpen && !showVisionModal && currentProcessingJob) {
      setShowVisionModal(true);
      setPendingVisionOpen(false);
    }
  }, [currentProcessingJob, pendingVisionOpen, showVisionModal]);

  useEffect(() => {
    setAssistantFeedback('点击话筒后说出指令，例如：帮我查一下今天有哪些出库任务。');
  }, [locale]);

  useEffect(() => (
    () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  ), []);

  return (
    <div className="flex flex-col gap-4 relative min-h-[calc(100vh-7rem)]">
      {!showVisionModal ? (
        <>
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-md shadow-sm transition-colors`}>
            <VoiceAssistantPanel
              theme={theme}
              title={t('title')}
              visionMode={visionMode}
              voicePrompt={voicePrompt}
              assistantTone={assistantTone}
              assistantStatus={assistantStatus}
              assistantTranscript={assistantTranscript}
              isListening={isAssistantListening}
              onVisionModeChange={(enabled) => {
                setVisionMode(enabled);
                if (!enabled) {
                  setVoicePrompt(false);
                }
              }}
              onVoicePromptChange={setVoicePrompt}
              onVoiceButtonClick={startVoiceAssistant}
            />

            <SearchFilters
              theme={theme}
              t={t}
              filterValues={filterValues}
              trayInventoryInput={trayInventoryInput}
              onFilterValuesChange={setFilterValues}
              onTrayInventoryInputChange={setTrayInventoryInput}
              onSearch={handleSearch}
            />
          </div>

          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-md shadow-sm flex-1 flex flex-col gap-4 transition-colors min-h-0 pb-24`}>
            <QueuePanel
              theme={theme}
              t={t}
              jobQueue={jobQueue}
              summary={queueSummary}
              visionMode={visionMode}
              hasActiveVisualJobs={activeJobs.some((job) => ['processing', 'waiting'].includes(job.status))}
              onRestoreVision={() => setShowVisionModal(true)}
              onClearQueue={() => {
                setJobQueue([]);
                setActiveJobs([]);
              }}
            />

            <PTable
              key="sap-to-table-v11"
              appId="sap-to-table-v11"
              columns={columns}
              rows={rows}
              loading={loading}
              pagination={pagination}
              onPaginationChange={setPagination}
              rowKey="id"
              theme={theme}
            />
          </div>

          <BottomActionBar
            theme={theme}
            t={t}
            rows={rows}
            selectedRows={selectedRows}
            isRowDisabled={isRowDisabled}
            inboundSelectedCount={inboundSelectedCount}
            outboundSelectedCount={outboundSelectedCount}
            hasLocationQueryRow={rows.some((row) => row.isLocationQuery)}
            onToggleSelectAll={() => {
              const selectableRows = rows.filter((row) => !isRowDisabled(row));
              if (selectableRows.length > 0 && selectedRows.length === selectableRows.length) {
                setSelectedRows([]);
              } else {
                setSelectedRows(selectableRows);
              }
            }}
            onOpenTransfer={openTransferModal}
            onInbound={() => handleJob('inbound')}
            onOutbound={() => handleJob('outbound')}
          />
        </>
      ) : (
        <div className="relative z-[100] min-h-[calc(100vh-7rem)] bg-gray-50 rounded-md overflow-hidden shadow-sm border border-gray-200">
          {currentProcessingJob ? (
            <SmartWorkStation
              onClose={() => setShowVisionModal(false)}
              initialLang={locale}
              voiceEnabled={voicePrompt}
              job={currentProcessingJob}
              pendingItems={pendingVisionItems}
              onJobCompleted={markProcessingJobCompleted}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 font-bold">
              正在准备视觉工作台...
            </div>
          )}
        </div>
      )}

      <TransferModal
        open={showTransferModal}
        theme={theme}
        form={transferForm}
        loading={transferLoading}
        onClose={() => setShowTransferModal(false)}
        onChange={setTransferForm}
        onConfirm={handleTransferConfirm}
      />

      <CMessageBox
        open={msgOpen}
        title={isConfirmingJob && confirmJobData ? t('confirmTitle', { action: confirmJobData.actionName }) : msgTitle}
        message={isConfirmingJob && confirmJobData ? (
          <JobConfirmContent
            theme={theme}
            actionName={confirmJobData.actionName}
            verbName={confirmJobData.verbName}
            bins={confirmJobData.bins}
            relevantRows={confirmJobData.relevantRows}
            unselectedItemsInSameBins={confirmJobData.unselectedItemsInSameBins}
            extraSelectedIds={extraSelectedIds}
            setExtraSelectedIds={setExtraSelectedIds}
          />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{msgContent}</div>
        )}
        type="info"
        onConfirm={handleConfirmJob}
        onClose={() => {
          setMsgOpen(false);
          setIsConfirmingJob(false);
          setConfirmJobData(null);
          setExtraSelectedIds([]);
        }}
        onCancel={() => {
          setMsgOpen(false);
          setIsConfirmingJob(false);
          setConfirmJobData(null);
          setExtraSelectedIds([]);
        }}
        confirmText="确定"
        cancelText="取消"
      />

      <ManualPickModal
        isOpen={showManualPickModal && !visionMode && !showVisionModal}
        onClose={() => {
          setShowManualPickModal(false);
          if (currentProcessingJob) {
            processedJobIds.current.add(currentProcessingJob.id);
          }
        }}
        currentJob={currentProcessingJob}
        pendingItems={pendingVisionItems}
        onComplete={() => {
          if (currentProcessingJob) {
            processedJobIds.current.add(currentProcessingJob.id);
          }
          markProcessingJobCompleted();
          setTimeout(() => setShowManualPickModal(false), 50);
        }}
        theme={theme}
        dict={sapOrderDict}
        locale={locale}
      />
    </div>
  );
}
