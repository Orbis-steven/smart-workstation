import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Hand, Info, Play, RotateCcw, ScanLine } from 'lucide-react';
import { ControlBtn } from './components/workstation/ControlBtn';
import { PendingItemsList } from './components/workstation/PendingItemsList';
import { InventoryTable } from './components/workstation/InventoryTable';
import { VisionGridPanel } from './components/workstation/VisionGridPanel';
import { workstationDict } from './i18n/workstationDict';
import { formatMessage } from './i18n/formatMessage';
import {
  changeVisionMode,
  fetchVisionState,
  getWorkstationErrorMessage,
  openVisionTray,
  resetVisionSession,
  sendPickRequest,
  sendScanEvent,
  sendSensorIn,
  sendSensorOut,
  startVisionSession,
} from './modules/workstation/api';
import { cancelSpeech, speakMessage } from './modules/workstation/speech';
import { getTaskItemKey } from './modules/workstation/grid';

export default function SmartWorkStation({
  onClose,
  initialLang = 'zh',
  voiceEnabled = false,
  job,
  pendingItems = [],
  onJobCompleted,
}) {
  const lang = initialLang.startsWith('en') ? 'en' : initialLang.startsWith('de') ? 'de' : 'zh';
  const t = (key) => formatMessage(workstationDict, lang, key);

  const [mode, setMode] = useState(job?.type === 'outbound' ? 'OUTBOUND' : 'INBOUND');
  const [state, setState] = useState('IDLE');
  const [currentItem, setCurrentItem] = useState(null);
  const [targetGrids, setTargetGrids] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [imgError, setImgError] = useState(false);
  const [completedItemIds, setCompletedItemIds] = useState([]);
  const [visionReady, setVisionReady] = useState(false);

  const displayPendingItems = useMemo(
    () => (pendingItems || []).filter((item) => !completedItemIds.includes(item.id)),
    [completedItemIds, pendingItems],
  );

  const [mockItemId, setMockItemId] = useState(displayPendingItems?.[0]?.itemNo || '');
  const [trayId, setTrayId] = useState(job?.bin || '');
  const [pickItemId, setPickItemId] = useState(displayPendingItems?.[0]?.itemNo || '');
  const [currentBin, setCurrentBin] = useState('');
  const [currentCoords, setCurrentCoords] = useState('');
  const [actualQty, setActualQty] = useState(displayPendingItems?.[0]?.qty || 0);

  const autoOpened = useRef(false);
  const sessionStarted = useRef(null);
  const hasLoggedError = useRef(false);

  const speak = (text) => speakMessage({ enabled: voiceEnabled, locale: lang, text });

  const fetchStateFromBackend = async () => {
    try {
      if (state === 'IDLE' && hasLoggedError.current) {
        return;
      }

      const data = await fetchVisionState();
      setMode(data.mode);
      setState(data.state);
      setCurrentItem(data.current_item);
      setTargetGrids(data.target_grids || []);
      setInventory(data.inventory || []);
      hasLoggedError.current = false;
    } catch (error) {
      if (!hasLoggedError.current) {
        console.warn(t('backend_warning'));
        hasLoggedError.current = true;
      }
    }
  };

  useEffect(() => {
    if (job?.id) {
      setCompletedItemIds([]);
    }
  }, [job?.id]);

  useEffect(() => {
    if (job) {
      setMode(job.type === 'outbound' ? 'OUTBOUND' : 'INBOUND');
      setTrayId(job.bin || '');
    }

    if (displayPendingItems.length > 0) {
      setMockItemId(displayPendingItems[0].itemNo);
      setPickItemId(displayPendingItems[0].itemNo);
      setCurrentBin(displayPendingItems[0].bin || '');
      setCurrentCoords(displayPendingItems[0].x && displayPendingItems[0].y ? `(${displayPendingItems[0].x}, ${displayPendingItems[0].y})` : '');
      setActualQty(displayPendingItems[0].qty);
    } else {
      setMockItemId('');
      setPickItemId('');
      setActualQty(0);
      setCurrentBin('');
      setCurrentCoords('');
    }
  }, [displayPendingItems, job]);

  useEffect(() => {
    if (!job?.id || sessionStarted.current === job.id) {
      return;
    }

    sessionStarted.current = job.id;
    autoOpened.current = true;
    const nextMode = job.type === 'outbound' ? 'OUTBOUND' : 'INBOUND';
    setMode(nextMode);
    setState('TRAY_OPENED');
    setVisionReady(true);

    startVisionSession({
      mode: nextMode,
      tray_id: job.bin || job.tray || '',
    })
      .then(() => fetchStateFromBackend())
      .catch(() => {
        setVisionReady(true);
      });
  }, [job?.bin, job?.id, job?.tray, job?.type]);

  useEffect(() => {
    const interval = setInterval(fetchStateFromBackend, 1000);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'IDLE' && !autoOpened.current) {
      autoOpened.current = true;
      setTimeout(() => {
        openVisionTray()
          .then(() => fetchStateFromBackend())
          .catch(() => {
            autoOpened.current = false;
          });
      }, 500);
    }
  }, [state]);

  useEffect(() => (
    () => {
      cancelSpeech();
    }
  ), []);

  const handleModeChange = async (newMode) => {
    try {
      await changeVisionMode(newMode);
      setMode(newMode);
      fetchStateFromBackend();
    } catch (error) {
      alert(getWorkstationErrorMessage(error));
    }
  };

  const handleScan = async () => {
    try {
      const item = displayPendingItems.find((pendingItem) => pendingItem.itemNo === mockItemId);
      await sendScanEvent({
        item_id: mockItemId,
        tray_id: trayId,
        expected_x: item ? item.x - 1 : 0,
        expected_y: item ? item.y - 1 : 0,
      });

      if (item) {
        setCurrentBin(item.bin);
        setCurrentCoords(`(${item.x}, ${item.y})`);
      }

      speak(t('scan_success'));
      fetchStateFromBackend();
    } catch (error) {
      alert(getWorkstationErrorMessage(error));
      speak(t('operation_failed'));
    }
  };

  const handlePickRequest = async () => {
    try {
      const item = displayPendingItems.find((pendingItem) => pendingItem.itemNo === pickItemId);
      await sendPickRequest({
        item_id: pickItemId,
        tray_id: trayId,
        expected_x: item ? item.x - 1 : undefined,
        expected_y: item ? item.y - 1 : undefined,
      });

      if (item) {
        setCurrentBin(item.bin);
        setCurrentCoords(`(${item.x}, ${item.y})`);
      }

      speak(t('pick_success'));
      fetchStateFromBackend();
    } catch (error) {
      alert(getWorkstationErrorMessage(error));
      speak(t('operation_failed'));
    }
  };

  const handleSensorInClick = async () => {
    try {
      await sendSensorIn();
      fetchStateFromBackend();
    } catch (error) {
      alert(getWorkstationErrorMessage(error));
    }
  };

  const handleSensorOutClick = async () => {
    try {
      const response = await sendSensorOut();
      alert(response.data.message);

      const message = response.data.message || '';
      let isSuccess = false;
      if (message.includes('Item bound')) {
        speak(t('inbound_done'));
        isSuccess = true;
      } else if (message.includes('Successfully picked')) {
        speak(t('outbound_done'));
        isSuccess = true;
      } else if (message.includes('Warning')) {
        speak(message.includes('wrong bin') ? t('wrong_bin') : t('wrong_item'));
      } else if (message.includes('No item')) {
        speak(t('no_change'));
      } else {
        speak(t('generic_done'));
      }

      const diffResult = response.data.diff_result;
      if (mode === 'INBOUND' && isSuccess && diffResult) {
        setCurrentCoords(`(${diffResult[0] + 1}, ${diffResult[1] + 1})`);
      } else if (mode === 'OUTBOUND' && isSuccess) {
        setCurrentCoords((prev) => prev ? `${prev} 提取成功` : '提取成功');
      }

      if (isSuccess) {
        const currentItemNo = mode === 'INBOUND' ? mockItemId : pickItemId;
        const targetItem = displayPendingItems.find((item) => item.itemNo === currentItemNo);
        if (targetItem) {
          setCompletedItemIds((prev) => {
            const next = [...prev, targetItem.id];
            if (next.length === pendingItems.length) {
              speak(t('tray_finished'));
              if (onJobCompleted) {
                setTimeout(() => onJobCompleted(), 3000);
              }
            }
            return next;
          });
        }
      }

      fetchStateFromBackend();
    } catch (error) {
      alert(getWorkstationErrorMessage(error));
      speak(t('diff_failed'));
    }
  };

  const handleReset = async () => {
    if (!window.confirm(t('reset_confirm'))) {
      return;
    }

    try {
      await resetVisionSession();
      setTargetGrids([]);
      autoOpened.current = false;
      fetchStateFromBackend();
    } catch (error) {
      alert(getWorkstationErrorMessage(error));
    }
  };

  const isIdle = state === 'IDLE';
  const canStartVisionAction = (state === 'TRAY_OPENED' || visionReady) && displayPendingItems.length > 0;
  const gridHighlightStates = ['TRAY_OPENED', 'SCANNING', 'PICK_REQUESTED', 'BASELINE', 'ACTION', 'TRIGGER', 'DIFF_CALC', 'VERIFYING', 'BINDING'];
  const canShowGridHighlights = gridHighlightStates.includes(state);
  const inboundTargetItem = mode === 'INBOUND' ? displayPendingItems.find((item) => item.itemNo === mockItemId) : null;
  const outboundTargetItem = mode === 'OUTBOUND' ? displayPendingItems.find((item) => item.itemNo === pickItemId) : null;
  const outboundTargetKey = getTaskItemKey(outboundTargetItem);

  return (
    <div className="h-full bg-gray-50 text-gray-900 font-sans p-4 flex flex-col">
      <div className="mb-4 flex justify-between items-center shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
            title={t('back_to_queue')}
          >
            <ArrowLeft className="w-5 h-5" />
            {t('back_to_queue')}
          </button>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors font-medium border border-red-200 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            {t('reset')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{t('panel_title')}</h2>

            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => handleModeChange('INBOUND')}
                disabled={!isIdle && mode !== 'INBOUND'}
                className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'INBOUND' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}
              >
                <ArrowDownLeft className="w-4 h-4" /> {t('inbound_label')}
              </button>
              <button
                onClick={() => handleModeChange('OUTBOUND')}
                disabled={!isIdle && mode !== 'OUTBOUND'}
                className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${mode === 'OUTBOUND' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'}`}
              >
                <ArrowUpRight className="w-4 h-4" /> {t('outbound_label')}
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className={`px-4 py-2 rounded-full font-bold text-white shadow-sm ${
                state === 'IDLE' ? 'bg-gray-400'
                  : state === 'TRAY_OPENED' ? 'bg-indigo-500'
                    : state === 'SCANNING' || state === 'PICK_REQUESTED' ? 'bg-blue-500'
                      : state === 'BASELINE' ? 'bg-purple-500'
                        : state === 'ACTION' ? 'bg-orange-500'
                          : state === 'TRIGGER' || state === 'DIFF_CALC' || state === 'VERIFYING' ? 'bg-yellow-500'
                            : state === 'BINDING' ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {state}
              </div>

              {currentItem && (
                <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
                  {mode === 'INBOUND' ? t('pending_inbound_label') : t('pending_outbound_label')}: {currentItem}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {mode === 'INBOUND' ? (
                <>
                  <ControlBtn icon={<ScanLine />} label={t('scan_bind_label')} onClick={handleScan} disabled={!canStartVisionAction} active={canStartVisionAction} />
                  <div className="pl-4 text-sm flex flex-col gap-3">
                    <FieldRow label={t('tray_id_label')} value={trayId} />
                    <EditableFieldRow label={t('item_id_label')} value={mockItemId} onChange={setMockItemId} disabled={!canStartVisionAction} />
                    <FieldRow label={t('bin_label')} value={currentBin || '-'} emphasizedClassName="font-mono text-green-600 font-bold text-base bg-green-50 px-3 py-1 rounded w-full" />
                    <FieldRow label={t('coords_label')} value={currentCoords || '-'} emphasizedClassName="font-mono text-blue-600 font-bold text-base bg-blue-50 px-3 py-1 rounded w-full" />
                    <EditableNumberRow label={t('actual_qty')} value={actualQty} onChange={setActualQty} />
                  </div>
                </>
              ) : (
                <>
                  <ControlBtn icon={<ScanLine />} label={t('pick_request_label')} onClick={handlePickRequest} disabled={!canStartVisionAction} active={canStartVisionAction} />
                  <div className="pl-4 text-sm flex flex-col gap-3">
                    <FieldRow label={t('tray_id_label')} value={trayId} />
                    <EditableFieldRow label={t('pick_item_id_label')} value={pickItemId} onChange={setPickItemId} disabled={!canStartVisionAction} />
                    <FieldRow label={t('bin_label')} value={currentBin || '-'} emphasizedClassName="font-mono text-green-600 font-bold text-base bg-green-50 px-3 py-1 rounded w-full" />
                    <FieldRow label={t('coords_label')} value={currentCoords || '-'} emphasizedClassName="font-mono text-blue-600 font-bold text-base bg-blue-50 px-3 py-1 rounded w-full" />
                    <EditableNumberRow label={t('actual_qty')} value={actualQty} onChange={setActualQty} />
                  </div>
                </>
              )}

              <PendingItemsList
                mode={mode}
                pendingItems={displayPendingItems}
                selectedItemNo={mode === 'INBOUND' ? mockItemId : pickItemId}
              />

              {displayPendingItems.length === 0 && pendingItems.length > 0 && (
                <div className="pl-4 mt-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-start gap-2">
                    <span className="text-lg">✅</span>
                    <p>{t('all_done')}</p>
                  </div>
                </div>
              )}

              <ControlBtn icon={<Hand />} label={t('hand_in_label')} onClick={handleSensorInClick} disabled={state !== 'SCANNING' && state !== 'PICK_REQUESTED'} active={state === 'SCANNING' || state === 'PICK_REQUESTED'} />
              <ControlBtn icon={<Play className="rotate-180" />} label={mode === 'INBOUND' ? t('place_done_label') : t('pick_done_label')} onClick={handleSensorOutClick} disabled={state !== 'ACTION'} active={state === 'ACTION'} />
            </div>

            {state === 'ACTION' && mode === 'INBOUND' && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-start gap-2">
                <Info className="w-5 h-5 shrink-0" />
                <p>{t('inbound_action_hint')}</p>
              </div>
            )}

            {state === 'ACTION' && mode === 'OUTBOUND' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                <Info className="w-5 h-5 shrink-0" />
                <p>{t('outbound_action_hint')}</p>
              </div>
            )}
          </div>

          <InventoryTable title={t('inventory_title')} inventory={inventory} t={t} />
        </div>

        <div className="lg:col-span-2">
          <VisionGridPanel
            title={t('camera_title')}
            job={job}
            imgError={imgError}
            onImageError={() => setImgError(true)}
            onImageLoad={() => setImgError(false)}
            state={state}
            visionReady={visionReady}
            inventory={inventory}
            mode={mode}
            displayPendingItems={displayPendingItems}
            inboundTargetItem={inboundTargetItem}
            outboundTargetKey={outboundTargetKey}
            canShowGridHighlights={canShowGridHighlights}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, value, emphasizedClassName }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-20">{label}:</span>
      <span className={emphasizedClassName || 'font-bold text-gray-800 text-base bg-gray-100 px-3 py-1 rounded w-full'}>{value}</span>
    </div>
  );
}

function EditableFieldRow({ label, value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-20">{label}:</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-2 border-indigo-300 rounded px-3 py-1 flex-1 text-base font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
        disabled={disabled}
      />
    </div>
  );
}

function EditableNumberRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-gray-500 w-20 font-bold">{label}:</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-2 border-indigo-300 rounded px-3 py-1 flex-1 text-base font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
        min="1"
      />
    </div>
  );
}
