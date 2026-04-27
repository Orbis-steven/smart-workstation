// @ts-nocheck
// 说明：由于 Windows 下 Demo_fin/demo_fin 目录大小写不一致，@types/react 会被重复解析并触发类型冲突。
// 临时对本文件关闭 TS 检查以规避报错，待统一目录大小写/修复工程配置后可移除此行。
import React from 'react';
// 从默认导入中解构 Hooks，避免具名导入在某些构建/类型检查策略下触发路径大小写歧义
const { useState, useEffect, useRef } = React;
import { PTable, CMessageBox } from 'orbcafe-ui';
import axios from 'axios';
import { mockSapOrdersJson } from './mockSapData';
import { mockItemLocationMapping as initialMockItemLocationMapping } from './mockItemLocationMapping';
import { mockTrayInventorySnapshot as initialMockTrayInventorySnapshot } from './mockTrayInventorySnapshot';
import { getItemLocationByItemNo, getTrayInventoryByTray, transferMockItemLocation } from './sapInventoryService';
import SmartWorkStation from './SmartWorkStation';
import { formatBinId, getGridPositionFromBin, getRandomGridPosition, getRandomTrayId, normalizeBinId, normalizeItemLocation, normalizeTrayId } from './trayNaming';
// 引入 Lucide React 图标
import { Camera, X, CheckCircle, Package, Mic, MicOff } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

// 新增 ManualPickModal 组件，用于手动确认当前 processing 的托盘任务
const ManualPickModal = ({ isOpen, onClose, currentJob, pendingItems, onComplete, theme, dict, locale }) => {
  if (!isOpen || !currentJob) return null;

  const t = (key, params = {}) => {
    let str = dict[locale]?.[key] || dict['zh'][key] || key;
    Object.keys(params).forEach(k => {
      str = str.replace(`{${k}}`, params[k]);
    });
    return str;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                托盘已就位: {currentJob.bin}
              </h2>
              <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                请按照列表提示操作以下物料
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Items List */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            {pendingItems.map((item, idx) => (
              <div key={item.id} className={`flex items-start gap-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'} transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className={`font-bold text-lg truncate ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                        {item.itemNo}
                      </h3>
                      <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                        {item.description}
                      </p>
                    </div>
                    <div className={`text-right shrink-0`}>
                      <div className={`text-2xl font-black ${item.jobType === 'inbound' ? 'text-green-600 dark:text-green-500' : 'text-indigo-600 dark:text-indigo-500'}`}>
                        {item.qty} <span className="text-sm font-normal opacity-60">件</span>
                      </div>
                      <div className={`text-xs font-medium uppercase mt-0.5 ${item.jobType === 'inbound' ? 'text-green-600/80 dark:text-green-500/80' : 'text-indigo-600/80 dark:text-indigo-500/80'}`}>
                        {item.jobType === 'inbound' ? t('inbound') : t('outbound')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed dark:border-gray-700">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 dark:text-gray-500 mb-0.5">Bin (Tray)</span>
                      <span className={`font-mono text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'} flex items-center gap-2`}>
                        {item.bin}
                        {item.isRecommendedBin && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200 whitespace-nowrap">系统推荐</span>}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 dark:text-gray-500 mb-0.5">坐标位置</span>
                      <span className={`font-mono text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>(X: {item.x}, Y: {item.y})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
          >
            <CheckCircle className="w-6 h-6" />
            完成操作并呼叫下一个托盘
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SapOrderPage({ locale = 'zh', theme = 'light' }) {
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgTitle, setMsgTitle] = useState('操作确认');
  const [msgContent, setMsgContent] = useState('');
  const [isConfirmingJob, setIsConfirmingJob] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [lastQueryMode, setLastQueryMode] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ itemNo: '', tray: '', bin: '' });
  const [transferLoading, setTransferLoading] = useState(false);
  const [trayInventoryInput, setTrayInventoryInput] = useState('');

  // 初始化 mock 数据状态
  const [localMockSapOrders, setLocalMockSapOrders] = useState(() => {
    return JSON.parse(mockSapOrdersJson);
  });
  const [mockItemLocationMapping, setMockItemLocationMapping] = useState(() => {
    return JSON.parse(JSON.stringify(initialMockItemLocationMapping));
  });
  const [mockTrayInventorySnapshot, setMockTrayInventorySnapshot] = useState(() => {
    return JSON.parse(JSON.stringify(initialMockTrayInventorySnapshot));
  });
  const [jobQueue, setJobQueue] = useState([]); // { id: '...', bin: 'TRAY-01', type: 'outbound', status: 'pending' | 'processing' | 'completed' }
  const [activeJobs, setActiveJobs] = useState([]); // 最多2个
  
  // === 视觉与语音模式状态 ===
  const [visionMode, setVisionMode] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState(false);
  const [showVisionModal, setShowVisionModal] = useState(false);
  const [pendingVisionOpen, setPendingVisionOpen] = useState(false);
  const [showManualPickModal, setShowManualPickModal] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState('点击话筒后说出指令，例如：帮我查一下今天有哪些出库任务。');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [assistantTone, setAssistantTone] = useState('idle');
  const [isAssistantListening, setIsAssistantListening] = useState(false);
  const processedJobIds = useRef(new Set());
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const recognitionErrorRef = useRef(false);
  
  // 用于弹窗中的补充勾选项状态
  const [confirmJobData, setConfirmJobData] = useState(null);
  const [extraSelectedIds, setExtraSelectedIds] = useState([]);

  // === 多语言字典 ===
  const dict = {
    zh: {
      title: 'SAP TO 查询与指令下发',
      toNo: 'TO号',
      workOrderNo: '工单号',
      deliveryNo: '外向交货单号',
      jobType: '任务类型',
      itemNo: '物料号',
      trayInventory: '托盘库存查询',
      desc: '描述',
      bin: 'Bin (Tray)',
      coords: '坐标 (X, Y)',
      qty: '需求数量',
      inventoryQty: '实际库存',
      currentStock: '当前库存',
      status: '状态',
      all: '全部',
      inbound: '入库',
      outbound: '出库',
      date: '创建日期',
      go: 'GO',
      processing: '提取中...',
      waiting: '就绪等待',
      pending: '排队中',
      completed: '已完成',
      inboundBtn: '下发入库指令 (已选 {count})',
      outboundBtn: '下发出库指令 (已选 {count})',
      queueTitle: 'Modula 设备处理队列 (双托盘机制)',
      processingCount: '处理中',
      waitingCount: '等待中',
      pendingCount: '排队中',
      completedCount: '已完成',
      tray: '托盘',
      itemsCount: '项',
      promptTitle: '{action}操作提示',
      promptMsg: '请先选择要{verb}的物料',
      errorTitle: '{action}操作报错',
      errorMsg: 'Modula 一次只能处理一张 TO 的指令。\n您当前选择了 {count} 张 TO ({list})，请取消多余的选择。',
      confirmTitle: '{action}确认与建议',
      confirmMsg: '您选择了 {count} 个物料准备{action}。\n\n【智能建议】{suggestion}\n由于 Modula 每次最多处理 2 个请求，这些托盘将被加入处理队列，并实时显示进度。',
      suggestionSingle: '当前选中的 {count} 个物料全部位于同一个托盘 [{bin}] 中。\n系统将只下发一次托盘呼叫指令，即可完成所有物料的{verb}。',
      suggestionMulti: '当前选中的物料分散在 {count} 个不同的托盘中 ({list})。\n系统将依次呼叫这些托盘，请按照设备提示顺序{verb}。',
      store: '存入',
      pick: '拣选',
      selectAll: '全选',
      deselectAll: '取消全选'
    },
    en: {
      title: 'SAP TO Query & Command Issuance',
      toNo: 'TO No',
      workOrderNo: 'Work Order',
      deliveryNo: 'Delivery No',
      jobType: 'Job Type',
      itemNo: 'Item No',
      trayInventory: 'Tray Inventory',
      desc: 'Description',
      bin: 'Bin (Tray)',
      coords: 'Coords (X, Y)',
      qty: 'Required Qty',
      inventoryQty: 'On-hand Qty',
      currentStock: 'Current Stock',
      status: 'Status',
      all: 'All',
      inbound: 'Inbound',
      outbound: 'Outbound',
      date: 'Creation Date',
      go: 'GO',
      processing: 'Processing...',
      waiting: 'Waiting',
      pending: 'Pending',
      completed: 'Completed',
      inboundBtn: 'Issue Inbound Cmd (Selected {count})',
      outboundBtn: 'Issue Outbound Cmd (Selected {count})',
      queueTitle: 'Modula Processing Queue (Dual Tray)',
      processingCount: 'Processing',
      waitingCount: 'Waiting',
      pendingCount: 'Pending',
      completedCount: 'Completed',
      tray: 'Tray',
      itemsCount: 'Items',
      promptTitle: '{action} Prompt',
      promptMsg: 'Please select items to {verb} first',
      errorTitle: '{action} Error',
      errorMsg: 'Modula can only process one TO at a time.\nYou selected {count} TOs ({list}). Please deselect the extras.',
      confirmTitle: '{action} Confirm & Advice',
      confirmMsg: 'You selected {count} items for {action}.\n\n[Advice] {suggestion}\nSince Modula processes up to 2 requests at a time, these trays will be queued and progress shown in real-time.',
      suggestionSingle: 'The {count} selected items are all in the same tray [{bin}].\nThe system will issue a single tray call to complete {verb} for all items.',
      suggestionMulti: 'The selected items are distributed across {count} different trays ({list}).\nThe system will call these trays sequentially, please {verb} according to the device prompts.',
      store: 'store',
      pick: 'pick',
      selectAll: 'Select All',
      deselectAll: 'Deselect All'
    },
    de: {
      title: 'SAP TO Abfrage & Befehlsausgabe',
      toNo: 'TA-Nr',
      workOrderNo: 'Fertigungsauftrag',
      deliveryNo: 'Lieferung',
      jobType: 'Auftragsart',
      itemNo: 'Material-Nr',
      trayInventory: 'Tablarbestand',
      desc: 'Beschreibung',
      bin: 'Bin (Tablar)',
      coords: 'Koord. (X, Y)',
      qty: 'Bedarfsmenge',
      inventoryQty: 'Istbestand',
      currentStock: 'Aktueller Bestand',
      status: 'Status',
      all: 'Alle',
      inbound: 'Einlagerung',
      outbound: 'Auslagerung',
      date: 'Erstellungsdatum',
      go: 'LOS',
      processing: 'Wird verarbeitet...',
      waiting: 'Wartend',
      pending: 'In Warteschlange',
      completed: 'Abgeschlossen',
      inboundBtn: 'Einlagerung Senden (Ausgewählt {count})',
      outboundBtn: 'Auslagerung Senden (Ausgewählt {count})',
      queueTitle: 'Modula Warteschlange (Doppeltablar)',
      processingCount: 'Verarbeitung',
      waitingCount: 'Wartend',
      pendingCount: 'Schlange',
      completedCount: 'Fertig',
      tray: 'Tablar',
      itemsCount: 'Pos',
      promptTitle: '{action} Hinweis',
      promptMsg: 'Bitte wählen Sie zuerst Materialien zum {verb} aus',
      errorTitle: '{action} Fehler',
      errorMsg: 'Modula kann nur einen TA gleichzeitig verarbeiten.\nSie haben {count} TAs ausgewählt ({list}). Bitte Auswahl aufheben.',
      confirmTitle: '{action} Bestätigung & Hinweis',
      confirmMsg: 'Sie haben {count} Materialien zur {action} ausgewählt.\n\n[Tipp] {suggestion}\nDa Modula max. 2 Anfragen gleichzeitig verarbeitet, werden diese in die Warteschlange eingereiht.',
      suggestionSingle: 'Alle {count} ausgewählten Materialien befinden sich im selben Tablar [{bin}].\nDas System sendet nur einen Rufbefehl, um {verb} für alle abzuschließen.',
      suggestionMulti: 'Ausgewählte Materialien sind auf {count} Tablare verteilt ({list}).\nDas System ruft diese nacheinander ab. Bitte {verb} nach Anweisung.',
      store: 'einlagern',
      pick: 'auslagern',
      selectAll: 'Alle auswählen',
      deselectAll: 'Alle abwählen'
    }
  };
  
  const t = (key, params = {}) => {
    let str = dict[locale]?.[key] || dict['zh'][key] || key;
    Object.keys(params).forEach(k => {
      str = str.replace(`{${k}}`, params[k]);
    });
    return str;
  };

  const setAssistantFeedback = (message, tone = 'idle') => {
    setAssistantStatus(message);
    setAssistantTone(tone);
  };

  const formatLocalDate = (offsetDays = 0) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeVoiceCode = (value) => {
    if (!value) return '';
    return String(value).trim().replace(/[。．，,；;！？!?]/g, '').replace(/\s+/g, '');
  };

  const inventoryDataProvider = 'mock';

  useEffect(() => {
    setMockTrayInventorySnapshot((prevSnapshot) => {
      const nextSnapshot = [...prevSnapshot];
      const existingKeys = new Set(
        nextSnapshot.map(record => {
          const normalizedRecord = normalizeItemLocation(record);
          return `${normalizedRecord.itemNo}::${normalizedRecord.bin}`;
        }),
      );

      Object.values(localMockSapOrders).forEach((toData) => {
        (toData.items || []).forEach((item) => {
          const normalizedItem = normalizeItemLocation(item);
          if (!normalizedItem?.tray || !normalizedItem?.bin) {
            return;
          }

          const key = `${normalizedItem.itemNo}::${normalizedItem.bin}`;
          if (existingKeys.has(key)) {
            return;
          }

          existingKeys.add(key);
          nextSnapshot.push({
            itemNo: normalizedItem.itemNo,
            description: normalizedItem.description,
            tray: normalizedItem.tray,
            bin: normalizedItem.bin,
            x: normalizedItem.x,
            y: normalizedItem.y,
            qty: normalizedItem.qty ?? 0,
            updatedAt: '2026-04-27 09:00:00',
          });
        });
      });

      if (nextSnapshot.length === prevSnapshot.length) {
        return prevSnapshot;
      }

      return nextSnapshot.sort((a, b) => a.tray.localeCompare(b.tray) || a.bin.localeCompare(b.bin) || a.itemNo.localeCompare(b.itemNo));
    });
  }, [localMockSapOrders]);

  const buildInventoryRowsFromSnapshot = async (trayId) => {
    const normalizedTrayId = normalizeTrayId(trayId);
    if (!normalizedTrayId) {
      return [];
    }

    const inventoryItems = await getTrayInventoryByTray({
      trayId: normalizedTrayId,
      provider: inventoryDataProvider,
      inventorySnapshot: mockTrayInventorySnapshot,
    });

    return inventoryItems.map(item => ({
      id: `inventory-${normalizedTrayId}-${item.itemNo}-${item.bin}`,
      toNo: '',
      workOrderNo: null,
      deliveryNo: null,
      jobType: 'inventory',
      itemNo: item.itemNo,
      description: item.description,
      tray: item.tray,
      bin: item.bin,
      x: item.x,
      y: item.y,
      qty: item.qty,
      createDate: item.updatedAt || '-',
      isInventoryQuery: true,
    }));
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

  const describeSearchFilters = (filters = {}) => {
    if (filters.trayInventory) {
      return `托盘 ${normalizeTrayId(filters.trayInventory) || filters.trayInventory} 的库存`;
    }

    if (filters.itemNo) {
      return `物料号 ${filters.itemNo} 的库位信息`;
    }

    const parts = [];
    const dateValue = filters.date?.[0];
    if (dateValue) {
      parts.push(dateValue === formatLocalDate(0) ? '今天' : dateValue);
    }

    if (filters.jobType === 'outbound') {
      parts.push('出库任务');
    } else if (filters.jobType === 'inbound') {
      parts.push('入库任务');
    } else {
      parts.push('任务');
    }

    if (filters.toNo) parts.push(`TO ${filters.toNo}`);
    if (filters.workOrderNo) parts.push(`工单 ${filters.workOrderNo}`);
    if (filters.deliveryNo) parts.push(`交货单 ${filters.deliveryNo}`);

    return parts.join('');
  };

  const buildVoiceSearchSummary = (data = [], filters = {}) => {
    if (filters.trayInventory) {
      const trayId = normalizeTrayId(filters.trayInventory) || filters.trayInventory;
      if (!data.length) {
        return `托盘 ${trayId} 没有查询到库存。`;
      }
      const preview = data
        .slice(0, 3)
        .map(item => `${item.itemNo}(${item.bin})`)
        .join('，');
      return `托盘 ${trayId} 当前共有 ${data.length} 条库存记录。${preview ? `包括 ${preview}${data.length > 3 ? ' 等' : ''}。` : ''}`;
    }

    if (filters.itemNo) {
      if (!data.length) {
        return `没有找到物料号 ${filters.itemNo} 的库位信息。`;
      }

      const record = data[0];
      return `已找到物料号 ${record.itemNo}，所在托盘 ${record.tray || '-'}，Bin ${record.bin || '-'}，坐标 ${record.x ?? '-'}, ${record.y ?? '-' }。`;
    }

    const dateValue = filters.date?.[0];
    const dateLabel = dateValue ? (dateValue === formatLocalDate(0) ? '今天' : dateValue) : '';
    const jobLabel = filters.jobType === 'outbound'
      ? '出库任务'
      : filters.jobType === 'inbound'
        ? '入库任务'
        : '任务';
    const prefix = `${dateLabel}${jobLabel}`.trim() || '当前条件';

    if (!data.length) {
      return `${prefix}没有查询到结果。`;
    }

    const groupedByTo = new Map();
    data.forEach(row => {
      const key = row.toNo || '-';
      if (!groupedByTo.has(key)) {
        groupedByTo.set(key, { toNo: key, count: 0 });
      }
      groupedByTo.get(key).count += 1;
    });

    const toList = Array.from(groupedByTo.values());
    const preview = toList
      .slice(0, 3)
      .map(item => `${item.toNo}（${item.count}项）`)
      .join('，');

    return `${prefix}共有 ${toList.length} 个 TO，${data.length} 个物料项。${preview ? `包括 ${preview}${toList.length > 3 ? ' 等' : ''}。` : ''}`;
  };

  const extractVoiceDate = (rawText) => {
    const compactText = rawText.replace(/\s+/g, '');
    if (/今天|今日|当天/.test(compactText)) return formatLocalDate(0);
    if (/昨天|昨日/.test(compactText)) return formatLocalDate(-1);
    if (/明天/.test(compactText)) return formatLocalDate(1);

    const fullDateMatch = rawText.match(/(20\d{2})[年/-](\d{1,2})[月/-](\d{1,2})/);
    if (fullDateMatch) {
      return `${fullDateMatch[1]}-${String(fullDateMatch[2]).padStart(2, '0')}-${String(fullDateMatch[3]).padStart(2, '0')}`;
    }

    const monthDayMatch = rawText.match(/(\d{1,2})月(\d{1,2})日?/);
    if (monthDayMatch) {
      const year = new Date().getFullYear();
      return `${year}-${String(monthDayMatch[1]).padStart(2, '0')}-${String(monthDayMatch[2]).padStart(2, '0')}`;
    }

    return '';
  };

  const parseVoiceCommand = (rawText) => {
    const spokenText = String(rawText || '').trim();
    const compactText = spokenText.replace(/\s+/g, '');

    if (!spokenText) {
      return { type: 'unknown' };
    }

    if (/(开启|打开).*(图像识别|视觉模式|视觉工作台)/.test(compactText)) {
      return { type: 'toggleVision', enabled: true };
    }

    if (/(关闭|退出).*(图像识别|视觉模式|视觉工作台)/.test(compactText)) {
      return { type: 'toggleVision', enabled: false };
    }

    if (/(开启|打开).*(语音提示|语音播报)/.test(compactText)) {
      return { type: 'toggleVoicePrompt', enabled: true };
    }

    if (/(关闭|停止).*(语音提示|语音播报)/.test(compactText)) {
      return { type: 'toggleVoicePrompt', enabled: false };
    }

    if (/(取消全选|清空选择|取消选择)/.test(compactText)) {
      return { type: 'clearSelection' };
    }

    if (/全选/.test(compactText)) {
      return { type: 'selectAll' };
    }

    if (/(下发|执行|开始|发起).*(出库)/.test(compactText)) {
      return { type: 'submitJob', jobType: 'outbound' };
    }

    if (/(下发|执行|开始|发起).*(入库)/.test(compactText)) {
      return { type: 'submitJob', jobType: 'inbound' };
    }

    const looksLikeSearch = /(查|查询|筛选|搜索|看看|显示|列出|找|任务|物料号|工单|交货单|有哪些)/.test(compactText);
    if (!looksLikeSearch) {
      return { type: 'unknown' };
    }

    const filters = {};

    if (/出库/.test(compactText)) {
      filters.jobType = 'outbound';
    } else if (/入库/.test(compactText)) {
      filters.jobType = 'inbound';
    }

    const dateValue = extractVoiceDate(spokenText);
    if (dateValue) {
      filters.date = [dateValue];
    }

    const itemNoMatch = spokenText.match(/物料号(?:是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
    if (itemNoMatch) {
      filters.itemNo = normalizeVoiceCode(itemNoMatch[1]);
      return { type: 'search', filters };
    }

    const toNoMatch = spokenText.match(/\bTO(?:号)?(?:是|为|[:：]|\s|-)?\s*([A-Za-z0-9-]+)/i);
    if (toNoMatch) {
      filters.toNo = normalizeVoiceCode(toNoMatch[1]).toUpperCase();
    }

    const workOrderMatch = spokenText.match(/(?:工单号|工单)(?:是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
    if (workOrderMatch) {
      filters.workOrderNo = normalizeVoiceCode(workOrderMatch[1]).toUpperCase();
    }

    const deliveryMatch = spokenText.match(/(?:交货单号|交货单)(?:是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
    if (deliveryMatch) {
      filters.deliveryNo = normalizeVoiceCode(deliveryMatch[1]).toUpperCase();
    }

    const trayInventoryMatch = spokenText.match(/(?:托盘|层|tray)(?:号|是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
    if (trayInventoryMatch && /(库存|库位|有哪些物料|哪些物料)/.test(compactText)) {
      filters.trayInventory = normalizeVoiceCode(trayInventoryMatch[1]).toUpperCase();
      return { type: 'search', filters };
    }

    return { type: 'search', filters };
  };

  // 将处理中任务变更为完成状态的独立函数，便于视觉模式手动调用或自动轮询调用
  const markProcessingJobCompleted = () => {
    setActiveJobs(prevActive => {
      const processingJob = prevActive.find(job => job.status === 'processing');
      if (!processingJob) {
        return prevActive;
      }

      const nextActive = prevActive.filter(job => job.id !== processingJob.id);
      const waitingJob = nextActive.find(job => job.status === 'waiting');
      const nextProcessingId = waitingJob?.id || null;
      const finalActive = nextActive.map(job => (
        job.id === nextProcessingId ? { ...job, status: 'processing' } : job
      ));

      setJobQueue(prevQueue => {
        const nextQueue = prevQueue.map(job => {
          if (job.id === processingJob.id) {
            return { ...job, status: 'completed' };
          }
          if (job.id === nextProcessingId) {
            return { ...job, status: 'processing' };
          }
          return job;
        });

        setLocalMockSapOrders(prevMock => {
          const newMock = { ...prevMock };
          const relatedTo = Object.values(newMock).find(to => to.toNo === processingJob.toNo);

          if (relatedTo) {
            const isToFullyCompleted = relatedTo.items.every(item => {
              const itemInQueue = nextQueue.find(qj => qj.toNo === relatedTo.toNo && qj.itemIds?.includes(item.id));
              return itemInQueue && itemInQueue.status === 'completed';
            });

            if (isToFullyCompleted) {
              console.log(`[Mock System] TO ${relatedTo.toNo} is fully completed.`);
              newMock[relatedTo.toNo] = { ...relatedTo, status: 'completed' };
            }
          }

          return newMock;
        });

        return nextQueue;
      });

      return finalActive;
    });
  };

  // 监听当前 activeJobs，如果开启了手动模式且有 processing 任务，自动弹出 ManualPickModal
  useEffect(() => {
    if (visionMode || showVisionModal) {
      setShowManualPickModal(false);
      return;
    }

    const currentProcessing = activeJobs.find(j => j.status === 'processing');
    
    // 如果有正在处理的任务，并且：
    // 1. 弹窗没有打开
    // 2. 当前弹窗处理的任务ID 和 我们记录的不一致（代表切换到了新托盘）
    if (currentProcessing && !showManualPickModal && !processedJobIds.current.has(currentProcessing.id)) {
      setShowManualPickModal(true);
    } else if (!currentProcessing && showManualPickModal) {
      setShowManualPickModal(false);
    }
  }, [activeJobs, visionMode, showVisionModal, showManualPickModal]);

  // 模拟轮询检查任务是否完成 (仅在特殊需要自动的场景使用)
  useEffect(() => {
    if (activeJobs.length === 0) return;

    // 为了实现用户要求的手动点击完成，我们移除自动完成的定时器
    // 除非未来需要一种纯演示的自动模式，现在强制所有的非视觉模式任务都需要手动确认
    // 所以这里把定时器注销掉
  }, [activeJobs, visionMode]);

  // 队列调度器：当活动任务小于 2 个，且等待队列有任务时，将其拉入活动状态
  useEffect(() => {
    const activeJobIds = new Set(activeJobs.map(job => job.id));
    const pendingJobs = jobQueue.filter(j => j.status === 'pending' && !activeJobIds.has(j.id));
    if (pendingJobs.length > 0 && activeJobs.length < 2) {
      const spotsAvailable = 2 - activeJobs.length;
      const jobsToActivate = pendingJobs.slice(0, spotsAvailable).map((j, index) => ({
        ...j,
        // 如果 active 里面已经有 processing 的了，新进来的只能是 waiting；如果 active 是空的，第一个进去的是 processing
        status: (activeJobs.some(a => a.status === 'processing') || index > 0) ? 'waiting' : 'processing'
      }));

      // 更新总队列状态
      setJobQueue(prevQueue => prevQueue.map(qj => {
        const toActivate = jobsToActivate.find(aj => aj.id === qj.id);
        return toActivate ? { ...qj, status: toActivate.status } : qj;
      }));

      setActiveJobs(prev => [...prev, ...jobsToActivate]);
    }
    
    // 如果 activeJobs 里面有两个都是 waiting (比如刚才完成了 processing 腾出空了)，把排第一的改成 processing
    if (activeJobs.length > 0 && !activeJobs.some(j => j.status === 'processing')) {
      setActiveJobs(prev => {
        const next = [...prev];
        const waitingIndex = next.findIndex(job => job.status === 'waiting');
        if (waitingIndex === -1) {
          return prev;
        }
        next[waitingIndex] = { ...next[waitingIndex], status: 'processing' };
        
        setJobQueue(prevQueue => prevQueue.map(qj => 
          qj.id === next[waitingIndex].id ? { ...qj, status: 'processing' } : qj
        ));
        return next;
      });
    }
  }, [jobQueue, activeJobs]);



  // === 判断行是否应该被禁用选中 ===
  const isRowDisabled = (row) => {
    if (row.isLocationQuery || row.isInventoryQuery) return true;
    // 1. 如果该 TO 在全局模拟数据里已经被标记为 completed，则不可选
    const relatedTo = Object.values(localMockSapOrders).find(to => to.toNo === row.toNo);
    if (relatedTo && relatedTo.status === 'completed') return true;

    // 2. 如果该物料已经在处理队列中（排队、等待、处理中、已完成），则不可选
    const isInQueue = jobQueue.some(j => j.toNo === row.toNo && j.itemIds?.includes(row.id));
    if (isInQueue) return true;

    return false;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // 只能选中没有被禁用的行
      const selectableRows = rows.filter(r => !isRowDisabled(r));
      setSelectedRows([...selectableRows]);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (row, checked) => {
    if (isRowDisabled(row)) return; // 禁用状态下不允许更改

    if (checked) {
      setSelectedRows([...selectedRows, row]);
    } else {
      setSelectedRows(selectedRows.filter(r => r.id !== row.id));
    }
  };

  const baseColumns = [
    {
      id: 'manual_selection',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '100%', paddingLeft: '8px' }}>
          <input 
            type="checkbox" 
            checked={rows.length > 0 && rows.filter(r => !isRowDisabled(r)).length > 0 && selectedRows.length === rows.filter(r => !isRowDisabled(r)).length}
            onChange={handleSelectAll}
            disabled={rows.length === 0 || rows.filter(r => !isRowDisabled(r)).length === 0}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </span>
      ),
      colDef: {
        width: 40,
        minWidth: 40,
        maxWidth: 40,
        flex: 0,
        sortable: false,
        filterable: false,
        align: 'left',
        headerAlign: 'left',
        disableColumnMenu: true,
        disableReorder: true
      },
      render: (_, row) => {
        const disabled = isRowDisabled(row);
        return (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '100%', paddingLeft: '8px' }}>
            <input 
              type="checkbox" 
              checked={selectedRows.some(r => r.id === row.id)}
              onChange={(e) => handleSelectRow(row, e.target.checked)}
              disabled={disabled}
              className={`w-4 h-4 text-indigo-600 rounded border-gray-300 ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
            />
          </span>
        );
      }
    },
    { id: 'toNo', label: t('toNo'), colDef: { width: 120 } },
    { 
      id: 'workOrderNo', 
      label: t('workOrderNo'), 
      colDef: { width: 130 },
      render: (_, row) => row.workOrderNo ? <span className="text-gray-700">{row.workOrderNo}</span> : <span className="text-gray-400">-</span>
    },
    { 
      id: 'deliveryNo', 
      label: t('deliveryNo'), 
      colDef: { width: 130 },
      render: (_, row) => row.deliveryNo ? <span className="text-gray-700">{row.deliveryNo}</span> : <span className="text-gray-400">-</span>
    },
    { 
      id: 'jobType', 
      label: t('jobType'), 
      colDef: { 
        width: 100,
        align: 'center',
        headerAlign: 'center'
      },
      render: (_, row) => {
        const isLocationRow = row.isLocationQuery || row.jobType === 'location';
        const isInventoryRow = row.isInventoryQuery || row.jobType === 'inventory';
        const className = isLocationRow
          ? 'text-amber-600 font-medium'
          : isInventoryRow
            ? 'text-sky-600 font-medium'
          : row.jobType === 'inbound'
            ? 'text-green-600 font-medium'
            : 'text-indigo-600 font-medium';
        const label = isLocationRow
          ? (locale === 'zh' ? '\u5e93\u4f4d' : locale === 'de' ? 'Lagerplatz' : 'Location')
          : isInventoryRow
            ? (locale === 'zh' ? '库存' : locale === 'de' ? 'Bestand' : 'Inventory')
          : row.jobType === 'inbound' ? t('inbound') : t('outbound');

        return <span className={className}>{label}</span>;
      }
    },
    { 
      id: 'itemNo', 
      label: t('itemNo'), 
      colDef: { 
        width: 300, 
      },
      render: (_, row) => (
        <span 
          title={row.itemNo}
          style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: 'block', 
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {row.itemNo}
        </span>
      )
    },
    { 
      id: 'description', 
      label: t('desc'), 
      colDef: { 
        width: 300,
      },
      render: (_, row) => (
        <span 
          title={row.description}
          style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: 'block', 
            width: '100%',
            maxWidth: '100%'
          }}
        >
          {row.description}
        </span>
      )
    },
    { 
      id: 'tray', 
      label: t('tray'), 
      colDef: { width: 130 },
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <span>{row.tray}</span>
          {row.isRecommendedBin && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200 whitespace-nowrap">推荐</span>}
        </div>
      )
    },
    { 
      id: 'bin', 
      label: t('bin'), 
      colDef: { width: 140 },
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <span>{row.bin}</span>
          {row.isRecommendedBin && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200 whitespace-nowrap">推荐</span>}
        </div>
      )
    },
    { 
      id: 'coords', 
      label: t('coords'), 
      render: (_, row) => `(${row.x}, ${row.y})`, 
      colDef: { width: 100 } 
    },
    { id: 'createDate', label: t('date'), colDef: { width: 120 } },
    { 
      id: 'qty', 
      label: t('qty'), 
      numeric: true, 
      colDef: { 
        width: 150,
        align: 'center',
        headerAlign: 'center'
      } 
    },
    { 
      id: 'status', 
      label: t('status'), 
      colDef: { width: 120 },
      render: (_, row) => {
        // 1. 如果该 TO 在全局模拟数据里已经被标记为 completed，直接返回已完成（持久化展示，不受局部 jobQueue 清理影响）
        const relatedTo = Object.values(localMockSapOrders).find(to => to.toNo === row.toNo);
        if (relatedTo && relatedTo.status === 'completed') {
          return <span className="text-green-600 font-medium">{t('completed')}</span>;
        }

        // 2. 如果全局数据里没完成，则从当前总队列里找看这个物料所在的托盘处于什么状态
        // 我们需要找到匹配该行对应托盘、类型一致、并且所属 TO 一致的最后一个任务（处理排队时的优先级）
        // 关键修复：必须匹配 job.toNo === row.toNo，彻底杜绝任何情况的“串台”
        // 新增修复：必须匹配 job.itemIds?.includes(row.id)，避免未选中的同托盘物料也显示为处理中
        const activeOrPendingJob = jobQueue
          .slice()
          .reverse()
          .find(j => j.bin === row.bin && j.type === row.jobType && j.toNo === row.toNo && j.itemIds?.includes(row.id) && ['pending', 'waiting', 'processing'].includes(j.status));
        
        // 如果没有进行中的任务，再看看有没有刚完成的（针对还没把整张 TO 改成 completed 的中间过渡状态）
        const completedJob = !activeOrPendingJob ? jobQueue
          .slice()
          .reverse()
          .find(j => j.bin === row.bin && j.type === row.jobType && j.toNo === row.toNo && j.itemIds?.includes(row.id) && j.status === 'completed') : null;

        const targetJob = activeOrPendingJob || completedJob;

        if (!targetJob) return <span className="text-gray-400">-</span>;

        if (targetJob.status === 'processing') return <span className="text-blue-600 font-medium">{t('processing')}</span>;
        if (targetJob.status === 'waiting') return <span className="text-yellow-600">{t('waiting')}</span>;
        if (targetJob.status === 'pending') return <span className="text-gray-500">{t('pending')}</span>;
        if (targetJob.status === 'completed') return <span className="text-green-600 font-medium">{t('completed')}</span>;
        
        return <span className="text-gray-400">-</span>;
      }
    },
  ];

  const columns = baseColumns.filter((column) => {
    if (lastQueryMode === 'trayInventory') {
      return !['manual_selection', 'toNo', 'workOrderNo', 'deliveryNo', 'status'].includes(column.id);
    }

    if (lastQueryMode === 'itemLocation') {
      return !['manual_selection', 'toNo', 'workOrderNo', 'deliveryNo', 'status', 'createDate'].includes(column.id);
    }

    return true;
  });

  const quantityColumnLabel = lastQueryMode === 'trayInventory'
    ? t('inventoryQty')
    : lastQueryMode === 'itemLocation'
      ? t('currentStock')
      : t('qty');

  const columnsWithContext = columns.map((column) => (
    column.id === 'qty'
      ? { ...column, label: quantityColumnLabel }
      : column
  ));

  const fetchData = async (filters) => {
    setLoading(true);
    try {
      console.log('--- START fetchData ---');
      console.log('Received filters:', filters);
      const itemNoFilter = String(filters?.itemNo || '').trim();
      const trayInventoryFilter = String(filters?.trayInventory || '').trim();

      if (trayInventoryFilter) {
        setLastQueryMode('trayInventory');
        const data = await buildInventoryRowsFromSnapshot(trayInventoryFilter);
        setRows(data);
        setSelectedRows([]);
        setPagination(p => ({ ...p, total: data.length }));
        return data;
      }

      if (itemNoFilter) {
        setLastQueryMode('itemLocation');
        let record = await getItemLocationByItemNo({
          itemNo: itemNoFilter,
          provider: inventoryDataProvider,
          itemLocationMapping: mockItemLocationMapping,
        }).catch(() => null);
        if (!record) {
          const res = await axios.get(`${API_URL}/item-location`, { params: { item_no: itemNoFilter } }).catch(() => null);
          record = res?.data || null;
        }
        const data = record ? [{
          id: `location-${record.itemNo}`,
          toNo: '-',
          workOrderNo: null,
          deliveryNo: null,
          jobType: 'location',
          itemNo: record.itemNo,
          description: 'Material location mapping',
          tray: record.tray,
          bin: record.bin,
          x: record.x,
          y: record.y,
          qty: record.qty ?? '-',
          createDate: record.updatedAt || '-',
          isLocationQuery: true,
        }] : [];
        setRows(data);
        setSelectedRows([]);
        setPagination(p => ({ ...p, total: data.length }));
        return data;
      }

      setLastQueryMode('toQuery');

      // 1. 如果没有任何查询条件，不再返回空数据，而是获取所有开放的 TO
      // 这里我们不再拦截空查询，直接往下走，遍历所有数据
      // 只要数据源的 status 是 'pending' (开放的 TO)，就会被默认匹配出来

      await new Promise(r => setTimeout(r, 500)); // simulate network
      
      let allMatchedItems = [];
      let foundJobTypes = new Set();

      console.log('Mock Data keys:', Object.keys(localMockSapOrders));

      Object.values(localMockSapOrders).forEach(toData => {
        let match = true;
        console.log('Checking TO:', toData.toNo);
        
        // 默认只展示还未完成的 (Open TO)，这里假设 pending 状态为 open
        if (toData.status !== 'pending') {
          match = false;
        }
        
        // 1. TO号过滤 (支持逗号分隔的多个TO号)
        if (filters && filters.toNo) {
          const searchTos = String(filters.toNo).split(/[,，\s]+/).filter(t => t.trim() !== '').map(t => t.toLowerCase());
          const currentToNo = toData.toNo ? String(toData.toNo).toLowerCase() : '';
          if (searchTos.length > 0 && !searchTos.some(st => currentToNo.includes(st))) {
            match = false;
          }
        }

        // 2. 工单号过滤
        if (filters && filters.workOrderNo) {
          const searchWOs = String(filters.workOrderNo).split(/[,，\s]+/).filter(t => t.trim() !== '').map(t => t.toLowerCase());
          if (searchWOs.length > 0) {
            const currentWONo = toData.workOrderNo ? String(toData.workOrderNo).toLowerCase() : '';
            if (!currentWONo || !searchWOs.some(st => currentWONo.includes(st))) {
              match = false;
            }
          }
        }

        // 3. 外向交货单号过滤
        if (filters && filters.deliveryNo) {
          const searchDOs = String(filters.deliveryNo).split(/[,，\s]+/).filter(t => t.trim() !== '').map(t => t.toLowerCase());
          if (searchDOs.length > 0) {
            const currentDONo = toData.deliveryNo ? String(toData.deliveryNo).toLowerCase() : '';
            if (!currentDONo || !searchDOs.some(st => currentDONo.includes(st))) {
              match = false;
            }
          }
        }
        
        if (filters && filters.jobType && toData.jobType !== filters.jobType) {
          match = false;
        }
        
        if (filters && filters.date && Array.isArray(filters.date) && filters.date.length > 0) {
          const filterDate = filters.date[0];
          if (filterDate) {
            const dateStr = typeof filterDate.format === 'function' ? filterDate.format('YYYY-MM-DD') : filterDate;
            if (toData.createDate && toData.createDate !== dateStr) {
              match = false;
              console.log('  -> Mismatch on date');
            }
          }
        }
        
        if (match) {
          console.log('  -> Match SUCCESS, adding items:', toData.items.length);
          const itemsWithJobType = toData.items.map(item => {
            let { tray, bin, x, y } = normalizeItemLocation(item);
            let isRecommendedBin = false;
            
            // 针对入库任务的全新物料（无库位信息），系统生成推荐库位
            if (toData.jobType === 'inbound' && (!bin || !tray)) {
              tray = 'TRAY-REC'; // 模拟推荐托盘
              bin = `TRAY-REC-M${Math.floor(Math.random() * 90 + 10)}`; // 模拟推荐 Bin
              x = Math.floor(Math.random() * 10 + 1);
              y = Math.floor(Math.random() * 5 + 1);
              const position = getRandomGridPosition();
              tray = getRandomTrayId();
              x = position.x;
              y = position.y;
              bin = formatBinId(tray, ((x - 1) * 2) + y);
              isRecommendedBin = true;
            }

            return { 
              ...item, 
              tray,
              bin,
              x,
              y,
              isRecommendedBin,
              jobType: toData.jobType,
              workOrderNo: toData.workOrderNo,
              deliveryNo: toData.deliveryNo,
              createDate: toData.createDate
            };
          });
          allMatchedItems = allMatchedItems.concat(itemsWithJobType);
          foundJobTypes.add(toData.jobType);
        }
      });

      console.log('Total matched items:', allMatchedItems.length);

      // 先按照 TO号升序，如果 TO号相同，再按照 Bin 升序，如果 Bin 相同，再按照物料号升序
      let data = [...allMatchedItems].sort((a, b) => {
        // 1. 按 TO号升序 (a 比较 b)
        const toNoCompare = a.toNo.localeCompare(b.toNo);
        if (toNoCompare !== 0) return toNoCompare;
        
        // 2. 按 Bin 升序 (a 比较 b)
        const binCompare = a.bin.localeCompare(b.bin);
        if (binCompare !== 0) return binCompare;
        
        // 3. 按物料号升序 (a 比较 b)
        return a.itemNo.localeCompare(b.itemNo);
      });
      
      setRows(data);
      setPagination(p => ({ ...p, total: data.length }));
      return data;
    } finally {
      setLoading(false);
      console.log('--- END fetchData ---');
    }
  };

  const handleSearch = async (newValues, options = {}) => {
    // 清空已选数据
    setSelectedRows([]);
    setShowVisionModal(false);
    setPendingVisionOpen(false);
    // 强制使用最新的 newValues 状态进行查询
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

  const openTransferModal = () => {
    const row = rows.find(r => r.isLocationQuery);
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
      let record;
      if (inventoryDataProvider === 'mock') {
        const transferResult = transferMockItemLocation({
          itemNo: transferForm.itemNo,
          tray,
          bin,
          itemLocationMapping: mockItemLocationMapping,
          inventorySnapshot: mockTrayInventorySnapshot,
        });
        setMockItemLocationMapping(transferResult.nextItemLocationMapping);
        setMockTrayInventorySnapshot(transferResult.nextInventorySnapshot);
        record = transferResult.record;
      } else {
        const res = await axios.post(`${API_URL}/item-location`, {
          item_no: transferForm.itemNo,
          tray,
          bin,
        });
        record = res.data;
      }
      setRows([{
        id: `location-${record.itemNo}`,
        toNo: '-',
        workOrderNo: null,
        deliveryNo: null,
        jobType: 'location',
        itemNo: record.itemNo,
        description: 'Material location mapping',
        tray: record.tray,
        bin: record.bin,
        x: record.x,
        y: record.y,
        qty: record.qty ?? '-',
        createDate: record.updatedAt || '-',
        isLocationQuery: true,
      }]);
      setPagination(p => ({ ...p, total: 1 }));
      setShowTransferModal(false);
      setMsgTitle('库位转移');
      setMsgContent('库位转移已记录。');
      setMsgOpen(true);
    } catch (e) {
      setMsgTitle('库位转移');
      setMsgContent(e.response?.data?.detail || '库位转移失败。');
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
      const selectableRows = rows.filter(r => !isRowDisabled(r));
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

      if (!('trayInventory' in command.filters)) {
        mergedFilters.trayInventory = '';
      }
      if (!('itemNo' in command.filters)) {
        mergedFilters.itemNo = '';
      }
      if (!('jobType' in command.filters) && /任务|查询|查一下|查一查|筛选/.test(spokenText.replace(/\s+/g, ''))) {
        delete mergedFilters.jobType;
      }
      if (!('toNo' in command.filters)) {
        mergedFilters.toNo = '';
      }
      if (!('workOrderNo' in command.filters)) {
        mergedFilters.workOrderNo = '';
      }
      if (!('deliveryNo' in command.filters)) {
        mergedFilters.deliveryNo = '';
      }
      if (!('date' in command.filters)) {
        mergedFilters.date = [];
      }

      const announceText = `正在查询${describeSearchFilters(mergedFilters)}。`;
      setAssistantFeedback(announceText, 'listening');
      speakAssistant(announceText);
      await handleSearch(mergedFilters, { announce: true });
      return;
    }

    setAssistantFeedback('暂时无法理解这条语音指令，请换一种说法，例如“帮我查一下今天有哪些出库任务”。', 'warning');
    speakAssistant('暂时无法理解这条语音指令，请换一种说法。');
  };

  const stopVoiceAssistant = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startVoiceAssistant = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const message = '当前浏览器不支持语音识别，请使用 Chrome 或 Edge。';
      setAssistantFeedback(message, 'error');
      speakAssistant(message);
      return;
    }

    if (isAssistantListening) {
      stopVoiceAssistant();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    finalTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    recognitionErrorRef.current = false;
    setAssistantTranscript('');
    setIsAssistantListening(true);
    setAssistantFeedback('正在听，请直接说出指令。', 'listening');

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript;
        } else {
          interimText += transcript;
        }
      }

      const combinedText = `${finalTranscriptRef.current}${interimText}`.trim();
      latestTranscriptRef.current = combinedText;
      setAssistantTranscript(combinedText);
    };

    recognition.onerror = (event) => {
      recognitionErrorRef.current = true;
      setIsAssistantListening(false);
      const errorMessage = event.error === 'not-allowed'
        ? '语音权限被拒绝，请先允许浏览器访问麦克风。'
        : event.error === 'no-speech'
          ? '没有检测到说话内容，请再试一次。'
          : `语音识别失败：${event.error}`;
      setAssistantFeedback(errorMessage, 'error');
      speakAssistant(errorMessage);
    };

    recognition.onend = async () => {
      setIsAssistantListening(false);
      recognitionRef.current = null;

      if (recognitionErrorRef.current) {
        return;
      }

      const transcript = (finalTranscriptRef.current || latestTranscriptRef.current || '').trim();
      if (!transcript) {
        setAssistantFeedback('没有识别到有效语音，请重试。', 'warning');
        speakAssistant('没有识别到有效语音，请重试。');
        return;
      }

      await executeVoiceCommand(transcript);
    };

    recognition.start();
  };

  const handleJob = (type) => {
    const actionName = type === 'inbound' ? t('inbound') : t('outbound');
    const verbName = type === 'inbound' ? t('store') : t('pick');

    const relevantRows = selectedRows.filter(r => r.jobType === type);

    if (relevantRows.length === 0) {
      setMsgTitle(t('promptTitle', { action: actionName }));
      setMsgContent(t('promptMsg', { verb: verbName }));
      setIsConfirmingJob(false);
      setMsgOpen(true);
      return;
    }

    // 校验是否跨TO
    const uniqueTOs = [...new Set(relevantRows.map(r => r.toNo))];
    if (uniqueTOs.length > 1) {
      setMsgTitle(t('errorTitle', { action: actionName }));
      setMsgContent(t('errorMsg', { count: uniqueTOs.length, list: uniqueTOs.join(', ') }));
      setIsConfirmingJob(false);
      setConfirmJobData(null);
      setMsgOpen(true);
      return;
    }

    const trays = [...new Set(relevantRows.map(r => r.tray || r.bin))];

    // 新增业务校验：在下发新 TO 之前，检查队列中是否有其他未完成的 TO
    const currentToNo = relevantRows[0].toNo;
    
    // 如果 jobQueue 中有任务，且这些任务属于其他的 TO，那么不允许操作
    if (jobQueue.length > 0) {
      const activeToNo = jobQueue[0].toNo; // 取队列中正在处理的 TO
      if (activeToNo !== currentToNo) {
        // 检查那个 activeToNo 是不是在全局数据中已经处于 completed 状态了
        const activeToData = Object.values(localMockSapOrders).find(to => to.toNo === activeToNo);
        const isActiveToFullyCompleted = activeToData && activeToData.status === 'completed';

        if (!isActiveToFullyCompleted) {
          // 如果那个 TO 还没走完，就拦住
          setMsgTitle(t('errorTitle', { action: actionName }));
          setMsgContent(`当前正在处理 TO [${activeToNo}] 的指令队列，且该 TO 尚未完全处理结束。\n系统不允许交叉操作。请等待 [${activeToNo}] 处理完毕，或点击队列右上角的 ✕ 关闭队列后再操作其他的 TO。`);
          setIsConfirmingJob(false);
          setConfirmJobData(null);
          setMsgOpen(true);
          return;
        }
      }
    }

    // 智能建议逻辑重构：检查同托盘漏选物料
    const allItemsInThisTo = rows.filter(r => r.toNo === currentToNo && r.jobType === type);
    
    // 找出当前选中的托盘中，有没有该 TO 的其他未选中物料，同时必须排除已经下发/已完成的物料
    const unselectedItemsInSameTrays = allItemsInThisTo.filter(item => {
      // 1. 必须在本次勾选的托盘中
      if (!trays.includes(item.tray || item.bin)) return false;
      // 2. 排除本次已经勾选的物料
      if (relevantRows.some(r => r.id === item.id)) return false;
      // 3. 排除已经被加入队列（下发过，包括排队中、处理中、已完成）的物料
      const isAlreadyDispatched = jobQueue.some(j => j.toNo === currentToNo && j.itemIds?.includes(item.id));
      if (isAlreadyDispatched) return false;
      
      return true;
    });

    // 把所有的确认框状态数据存起来，交给专门的 render 函数去生成
    setConfirmJobData({
      relevantRows,
      actionName,
      verbName,
      bins: trays,
      unselectedItemsInSameBins: unselectedItemsInSameTrays,
      type
    });
    
    // 默认不勾选漏选项，让用户自己决定是否要带上
    setExtraSelectedIds([]);

    setIsConfirmingJob(true);
    setMsgOpen(true);
  };

  // 根据当前状态，动态渲染弹窗里面的富文本与交互控件
  const renderConfirmJobMessage = () => {
    if (!confirmJobData) return null;
    const { relevantRows, actionName, verbName, bins, unselectedItemsInSameBins } = confirmJobData;
    
    const totalSelectedCount = relevantRows.length + extraSelectedIds.length;

    let suggestion = null;

    if (unselectedItemsInSameBins.length > 0) {
      // 场景 1：有同托盘漏选项
      suggestion = (
        <div className="space-y-2">
          <div>
            检测到在您本次需要操作的托盘中，<strong className="text-red-600">还有该 TO 的其他物料未被选中</strong>：
          </div>
          <div className={`border rounded-md p-2 max-h-40 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-amber-200'}`}>
            {unselectedItemsInSameBins.map(item => (
              <label key={item.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-amber-50'}`}>
                <input 
                  type="checkbox" 
                  checked={extraSelectedIds.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExtraSelectedIds(prev => [...prev, item.id]);
                    } else {
                      setExtraSelectedIds(prev => prev.filter(id => id !== item.id));
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  托盘 <strong className="text-indigo-500">{item.tray || item.bin}</strong> - 物料: {item.itemNo} <span className="opacity-70">(数量: {item.qty})</span>
                </span>
              </label>
            ))}
          </div>
          <div className={`mt-2 font-medium text-sm ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>
            建议：直接在上方勾选漏选项一同下发，以减少托盘的往复呼叫次数。
          </div>
        </div>
      );
    } else if (bins.length === 1) {
      // 场景 2：全部选全，且都在 1 个托盘
      suggestion = (
        <span>
          当前选中的 <strong className="text-indigo-600">{totalSelectedCount}</strong> 个物料全部位于同一个托盘 [<strong className="text-indigo-600">{bins[0]}</strong>] 中。
          <br />系统将只下发 <strong className="text-green-600">一次</strong> 托盘呼叫指令，即可完成所有物料的{verbName}。
        </span>
      );
    } else {
      // 场景 3：全部选全，分布在多个托盘
      suggestion = (
        <span>
          当前选中的物料分散在 <strong className="text-red-600">{bins.length}</strong> 个不同的托盘中 (<strong className="text-gray-700">{bins.join(', ')}</strong>)。
          <br />系统将 <strong className="text-indigo-600">依次</strong> 呼叫这些托盘，请按照设备提示顺序{verbName}。
        </span>
      );
    }

    return (
      <div className="text-sm text-gray-700 space-y-3">
        <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
          您选择了 <strong className="text-indigo-500 text-base">{totalSelectedCount}</strong> 个物料准备 <strong className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>{actionName}</strong>。
        </div>
        <div className={`border p-3 rounded-md ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200') : (theme === 'dark' ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100')}`}>
          <div className={`font-bold mb-2 flex items-center gap-1 ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-800') : (theme === 'dark' ? 'text-blue-400' : 'text-blue-800')}`}>
            <span role="img" aria-label="bulb">{unselectedItemsInSameBins.length > 0 ? '⚠️' : '💡'}</span> 【智能建议】
          </div>
          <div className={`leading-relaxed ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'text-amber-200/80' : 'text-amber-900') : (theme === 'dark' ? 'text-blue-200/80' : 'text-blue-900')}`}>
            {suggestion}
          </div>
        </div>
        <div className={`text-xs pt-2 border-t ${theme === 'dark' ? 'text-gray-500 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
          由于 Modula 每次最多处理 2 个请求，这些托盘将被加入处理队列，并实时显示进度。
        </div>
      </div>
    );
  };

  const handleConfirmJob = () => {
    setMsgOpen(false);
    if (isConfirmingJob && confirmJobData) {
      const { relevantRows, unselectedItemsInSameBins, type } = confirmJobData;
      
      // 合并原始选中的行和弹窗里额外勾选的行
      // 这里确保 extraSelectedIds 是最新的，且仅包含用户勾选的漏选项
      const extraRows = unselectedItemsInSameBins.filter(item => extraSelectedIds.includes(item.id));
      const finalRowsToProcess = [...relevantRows, ...extraRows];
      
      // 获取需要操作的唯一个托盘 (Tray) 并按照托盘号从小到大排序
      const traysToProcess = [...new Set(finalRowsToProcess.map(r => r.tray))].sort((a, b) => a.localeCompare(b));
      
      // 将这些托盘作为一个个独立的任务加入队列，并在里面带上 toNo 标识
      const newJobs = traysToProcess.map(tray => {
        const itemsInTray = finalRowsToProcess.filter(r => r.tray === tray);
        return {
          id: `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tray: tray, // Use tray instead of bin
          bin: tray,  // Keep bin as tray for backward compatibility with other parts of the code
          type: type,
          toNo: finalRowsToProcess[0].toNo, // 增加 TO 维度的强绑定
          status: 'pending', // 初始状态为 pending，由 useEffect 调度
          itemsCount: itemsInTray.length,
          itemIds: itemsInTray.map(r => r.id) // 增加：记录具体下发了哪些物料
        };
      });

      // 追加到现有的队列中（因为我们已经拦截了跨 TO，所以走到这里的必然是空队列或者是同一个 TO 的分批任务）
      // 新增：如果队列里上一个 TO 已经完全 completed，或者此时用户新发起的 TO 号和旧队列的 TO 号不同
      // 这时候应该把旧队列清空，给新 TO 让路
      setJobQueue(prev => {
        if (prev.length > 0 && prev[0].toNo !== finalRowsToProcess[0].toNo) {
          // 上一个 TO 已经结束（否则在上面的校验中就会被 return 掉），直接清空旧队列
          return [...newJobs];
        }
        return [...prev, ...newJobs];
      });
      
      // 精确清理：把原来选中的、以及这次弹窗里额外选中的，都从 selectedRows 里摘掉
      // （只有实际被提交处理的行才会被取消勾选，用户在弹窗里没勾选的漏选项依然保留在列表里）
      const processedIds = finalRowsToProcess.map(r => r.id);
      setSelectedRows(prev => prev.filter(r => !processedIds.includes(r.id)));
      
      setIsConfirmingJob(false);
      setConfirmJobData(null);
      setExtraSelectedIds([]);
      setPendingVisionOpen(visionMode);

      // 如果开启了图像识别模式，则弹出视觉窗口
    }
  };

  // 不再需要 headerActions，它已经被直接渲染到了 return 结构中

  const inboundSelectedCount = selectedRows.filter(r => r.jobType === 'inbound').length;
  const outboundSelectedCount = selectedRows.filter(r => r.jobType === 'outbound').length;

  const closeVisionModal = () => {
    setShowVisionModal(false);
  };

  // 获取当前正在处理的任务和物料
  const currentProcessingJob = activeJobs.find(j => j.status === 'processing') || jobQueue.find(j => ['processing', 'pending', 'waiting'].includes(j.status));
  const pendingVisionItems = currentProcessingJob ? rows.filter(r => currentProcessingJob.itemIds.includes(r.id)) : [];

  // === 智能视觉工作流 (集成真实 FastAPI 后端) ===
  // 监听：如果当前视觉任务已经被其他方式（如关闭视觉模式后自动流转）完成，重置视觉状态
  useEffect(() => {
    if (processedJobIds.current) {
      // 遍历检查 Set 中的 job_id 是否还在 activeJobs 里
      const ArrayFromSet = Array.from(processedJobIds.current);
      ArrayFromSet.forEach(id => {
        if (!activeJobs.some(j => j.id === id)) {
          processedJobIds.current.delete(id);
        }
      });
    }
  }, [activeJobs]);

  useEffect(() => {
    if (pendingVisionOpen && !showVisionModal && currentProcessingJob) {
      setShowVisionModal(true);
      setPendingVisionOpen(false);
    }
  }, [pendingVisionOpen, showVisionModal, currentProcessingJob]);

  useEffect(() => {
    setAssistantFeedback('点击话筒后说出指令，例如：帮我查一下今天有哪些出库任务。');
  }, [locale]);

  useEffect(() => {
    handleSearch(filterValues);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 relative min-h-[calc(100vh-7rem)]">
      {/* 当未开启视觉弹窗时，显示原来的列表界面 */}
      {!showVisionModal ? (
        <>
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-md shadow-sm transition-colors`}>
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{t('title')}</h2>
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-gray-700 px-4 py-2 rounded-xl border border-slate-200 dark:border-gray-600 transition-colors">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={visionMode} onChange={(e) => {
                      setVisionMode(e.target.checked);
                      if (!e.target.checked) setVoicePrompt(false);
                    }} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${visionMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${visionMode ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                  <span className={`text-base font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>图像识别模式</span>
                </label>

                {visionMode && (
                  <label className="flex items-center gap-3 cursor-pointer animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={voicePrompt} onChange={(e) => setVoicePrompt(e.target.checked)} />
                      <div className={`block w-14 h-8 rounded-full transition-colors ${voicePrompt ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${voicePrompt ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                    <span className={`text-base font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>语音提示</span>
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={startVoiceAssistant}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                  isAssistantListening
                    ? 'bg-red-500 border-red-500 text-white animate-pulse'
                    : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title={isAssistantListening ? '停止语音助手' : '启动语音助手'}
              >
                {isAssistantListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>

          </div>

          <div className={`mt-3 rounded-xl border px-4 py-3 flex flex-col gap-1 transition-colors ${
            assistantTone === 'error'
              ? (theme === 'dark' ? 'bg-red-950/30 border-red-900 text-red-200' : 'bg-red-50 border-red-200 text-red-700')
              : assistantTone === 'warning'
                ? (theme === 'dark' ? 'bg-amber-950/20 border-amber-900 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800')
                : assistantTone === 'success'
                  ? (theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                  : assistantTone === 'listening'
                    ? (theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-700')
                    : (theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-600')
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isAssistantListening ? 'bg-red-500 animate-pulse' : assistantTone === 'success' ? 'bg-emerald-500' : assistantTone === 'warning' ? 'bg-amber-500' : assistantTone === 'error' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
              <span className="text-sm font-bold">语音小助手</span>
            </div>
            <div className="text-sm leading-6">{assistantStatus}</div>
            {assistantTranscript && (
              <div className={`text-xs font-mono break-all ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                识别内容：{assistantTranscript}
              </div>
            )}
          </div>

        <div className={`flex flex-wrap items-end gap-6 p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-sm mb-4 transition-colors`}>
          <div className="flex flex-wrap items-end gap-6 flex-1">
            <div className="w-[180px]">
              <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('jobType')}</label>
              <select
                value={filterValues.jobType || ''}
                onChange={(e) => setFilterValues({ ...filterValues, jobType: e.target.value })}
                className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
              >
                <option value="">{t('all')}</option>
                <option value="inbound">{t('inbound')}</option>
                <option value="outbound">{t('outbound')}</option>
              </select>
            </div>
            <div className="w-[200px]">
              <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('toNo')}</label>
              <input 
                  type="text" 
                  value={filterValues.toNo || ''}
                  onChange={(e) => setFilterValues({ ...filterValues, toNo: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(filterValues)}
                  className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="TO-1001"
                />
            </div>
            <div className="w-[220px]">
              <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>物料号</label>
              <input 
                type="text" 
                value={filterValues.itemNo || ''}
                onChange={(e) => setFilterValues({ ...filterValues, itemNo: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(filterValues)}
                className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="7733-2009-113-P01"
              />
            </div>
            <div className="w-[220px]">
              <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('trayInventory')}</label>
              <input 
                type="text" 
                value={trayInventoryInput}
                onChange={(e) => {
                  setTrayInventoryInput(e.target.value);
                  setFilterValues({ ...filterValues, trayInventory: e.target.value });
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch({ ...filterValues, trayInventory: trayInventoryInput || e.currentTarget.value })}
                className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="1001"
              />
            </div>
            
            {filterValues.jobType !== 'inbound' && (
              <>
                <div className="w-[200px]">
                  <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('workOrderNo')}</label>
                  <input 
                    type="text" 
                    value={filterValues.workOrderNo || ''}
                    onChange={(e) => setFilterValues({ ...filterValues, workOrderNo: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(filterValues)}
                    className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="WO-20010"
                  />
                </div>
                <div className="w-[200px]">
                  <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('deliveryNo')}</label>
                  <input 
                    type="text" 
                    value={filterValues.deliveryNo || ''}
                    onChange={(e) => setFilterValues({ ...filterValues, deliveryNo: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(filterValues)}
                    className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="DO-30010"
                  />
                </div>
              </>
            )}

            <div className="w-[200px]">
              <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('date')}</label>
              <input 
                type="date"
                value={filterValues.date ? filterValues.date[0] : ''}
                onChange={(e) => setFilterValues({ ...filterValues, date: e.target.value ? [e.target.value] : [] })}
                className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
              />
            </div>
          </div>
          <div className="shrink-0">
            <button
              onClick={() => handleSearch(filterValues)}
              className="px-8 py-3 text-lg bg-[#0A6ED1] text-white font-bold rounded-xl shadow-md hover:bg-[#0854A0] transition-colors h-[54px] border border-transparent active:scale-95"
            >
              {t('go')}
            </button>
          </div>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 rounded-md shadow-sm flex-1 flex flex-col gap-4 transition-colors min-h-0 pb-24`}>
        {/* Modula 实时处理队列 */}
        {jobQueue.length > 0 && (
          <div className={`p-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-slate-50 border-slate-200'} border rounded-md transition-colors relative`}>
            <button 
              onClick={() => {
                setJobQueue([]);
                setActiveJobs([]);
              }}
              className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700'} transition-colors text-xs font-bold`}
              title="关闭并清空队列"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-3 pr-8">
              <div className="flex items-center gap-4">
                <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>{t('queueTitle')}</h3>
                {visionMode && !showVisionModal && activeJobs.some(j => ['processing', 'waiting'].includes(j.status)) && (
                  <button 
                    onClick={() => setShowVisionModal(true)}
                    className="px-3 py-1 text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 rounded-md shadow-sm transition-colors flex items-center gap-1 animate-pulse"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    恢复视觉工作台
                  </button>
                )}
              </div>
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                {t('processingCount')}: {activeJobs.filter(j => j.status === 'processing').length} | 
                {t('waitingCount')}: {activeJobs.filter(j => j.status === 'waiting').length} | 
                {t('pendingCount')}: {jobQueue.filter(j => j.status === 'pending').length} | 
                {t('completedCount')}: {jobQueue.filter(j => j.status === 'completed').length}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {jobQueue.map(job => {
                let bgClass = theme === 'dark' ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200';
                let icon = '🕒';
                let statusText = t('pending');

                if (job.status === 'processing') {
                  bgClass = theme === 'dark' ? 'bg-blue-900 text-blue-300 border-blue-800 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
                  icon = '⚙️';
                  statusText = t('processing');
                } else if (job.status === 'waiting') {
                  bgClass = theme === 'dark' ? 'bg-yellow-900 text-yellow-300 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
                  icon = '⏳';
                  statusText = t('waiting');
                } else if (job.status === 'completed') {
                  bgClass = theme === 'dark' ? 'bg-green-900 text-green-300 border-green-800 opacity-50' : 'bg-green-50 text-green-700 border-green-200 opacity-50';
                  icon = '✅';
                  statusText = t('completed');
                }

                return (
                  <div key={job.id} className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm ${bgClass} transition-all duration-500`}>
                    <span className="text-base">{icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{t('tray')}: {job.bin}</span>
                      <span className="text-[10px] uppercase opacity-80">{job.type === 'inbound' ? t('inbound') : t('outbound')} · {job.itemsCount}{t('itemsCount')} · {statusText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          <PTable 
            key="table-force-reset-width-4" // 第四次重置，彻底回退手动复选框
            appId="sap-to-table-v10"
            columns={columnsWithContext}
            rows={rows}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            rowKey="id"
            theme={theme}
          />
        </div>
        
        {/* Pad 风格底部操作栏 Bottom Action Bar */}
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-50 transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                const selectableRows = rows.filter(r => !isRowDisabled(r));
                if (selectableRows.length > 0 && selectedRows.length === selectableRows.length) {
                  setSelectedRows([]);
                } else {
                  setSelectedRows([...selectableRows]);
                }
              }}
              disabled={rows.length === 0 || rows.filter(r => !isRowDisabled(r)).length === 0}
              className={`px-6 py-3 rounded-xl text-lg font-bold border-2 transition-all active:scale-95 ${
                rows.length === 0 || rows.filter(r => !isRowDisabled(r)).length === 0
                  ? (theme === 'dark' ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-gray-200 text-gray-400 cursor-not-allowed')
                  : (selectedRows.length === rows.filter(r => !isRowDisabled(r)).length && selectedRows.length > 0
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50')
              }`}
            >
              {rows.length > 0 && rows.filter(r => !isRowDisabled(r)).length > 0 && selectedRows.length === rows.filter(r => !isRowDisabled(r)).length ? t('deselectAll') : t('selectAll')}
            </button>
            <div className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              已选择: <span className="text-green-600 font-bold">{inboundSelectedCount}</span> 入库, <span className="text-indigo-600 font-bold">{outboundSelectedCount}</span> 出库
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={openTransferModal}
              disabled={!rows.some(r => r.isLocationQuery)}
              className={`px-8 py-4 rounded-xl text-lg font-bold shadow-md transition-all active:scale-95 ${
                !rows.some(r => r.isLocationQuery)
                  ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              库位转移
            </button>
            <button
              onClick={() => handleJob('inbound')}
              disabled={inboundSelectedCount === 0}
              className={`px-8 py-4 rounded-xl text-lg font-bold shadow-md transition-all active:scale-95 ${
                inboundSelectedCount === 0 
                  ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {t('inboundBtn', { count: inboundSelectedCount })}
            </button>
            <button
              onClick={() => handleJob('outbound')}
              disabled={outboundSelectedCount === 0}
              className={`px-8 py-4 rounded-xl text-lg font-bold shadow-md transition-all active:scale-95 ${
                outboundSelectedCount === 0 
                  ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {t('outboundBtn', { count: outboundSelectedCount })}
            </button>
          </div>
        </div>
        </>
      ) : (
        /* === 真实的 SmartWorkStation 视觉识别页面 === */
        <div className="relative z-[100] min-h-[calc(100vh-7rem)] bg-gray-50 rounded-md overflow-hidden shadow-sm border border-gray-200">
          {currentProcessingJob ? (
            <SmartWorkStation 
              onClose={closeVisionModal} 
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

      {showTransferModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-800/70' : 'border-gray-100 bg-slate-50'}`}>
              <h2 className="text-xl font-bold">库位转移</h2>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>确认后当前系统会写入本地映射文件，后续接入 SAP 时这里会调用 SAP 接口同步。</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>物料号</label>
                <input
                  value={transferForm.itemNo}
                  disabled
                  className={`w-full border-2 rounded-xl px-4 py-3 text-base ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>转入 Tray</label>
                  <input
                    value={transferForm.tray}
                    onChange={(e) => setTransferForm({ ...transferForm, tray: e.target.value })}
                    placeholder="1001"
                    className={`w-full border-2 rounded-xl px-4 py-3 text-base focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>转入 Bin</label>
                  <input
                    value={transferForm.bin}
                    onChange={(e) => setTransferForm({ ...transferForm, bin: e.target.value })}
                    placeholder="1001M01"
                    className={`w-full border-2 rounded-xl px-4 py-3 text-base focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-slate-50'}`}>
              <button
                onClick={() => setShowTransferModal(false)}
                className={`px-5 py-2.5 rounded-xl font-bold border ${theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                取消
              </button>
              <button
                onClick={handleTransferConfirm}
                disabled={transferLoading}
                className={`px-6 py-2.5 rounded-xl font-bold text-white ${transferLoading ? 'bg-gray-400 cursor-wait' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                {transferLoading ? '处理中...' : '确定转移'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CMessageBox
        open={msgOpen}
        title={isConfirmingJob && confirmJobData ? t('confirmTitle', { action: confirmJobData.actionName }) : msgTitle}
        message={
          isConfirmingJob && confirmJobData ? (
            renderConfirmJobMessage()
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{msgContent}</div>
          )
        }
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

      {/* 视觉工作台弹窗 */}
      {/* 手动确认弹窗 (当没有开启视觉模式时) */}
      <ManualPickModal 
        isOpen={showManualPickModal && !visionMode && !showVisionModal}
        onClose={() => {
          setShowManualPickModal(false);
          // 如果用户手动关闭了，记录这个任务已被处理过（放弃或稍后再处理），避免它一直重新弹
          if (currentProcessingJob) {
            processedJobIds.current.add(currentProcessingJob.id);
          }
        }}
        currentJob={currentProcessingJob}
        pendingItems={pendingVisionItems}
        onComplete={() => {
          if (currentProcessingJob) {
            processedJobIds.current.add(currentProcessingJob.id); // 记录该任务已处理完
          }
          markProcessingJobCompleted();
          // 短暂延迟关闭弹窗，确保 activeJobs 先推进，避免弹窗闪烁
          setTimeout(() => setShowManualPickModal(false), 50);
        }}
        theme={theme}
        dict={dict}
        locale={locale}
      />
    </div>
  );
}
