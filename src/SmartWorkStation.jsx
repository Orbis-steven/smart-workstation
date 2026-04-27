import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Package, ScanLine, Hand, Play, Info, RotateCcw, ArrowUpRight, ArrowDownLeft, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { formatBinId, getBinNumberFromGrid, normalizeTrayId, MODULA_GRID_COLUMNS, MODULA_GRID_ROWS } from './trayNaming';

const API_URL = 'http://127.0.0.1:8000'; // Note: Changed to 8000 since the previous code in SapOrderPage used 8000

export default function SmartWorkStation({ onClose, initialLang = 'zh', voiceEnabled = false, job, pendingItems = [], onJobCompleted }) {
  const [mode, setMode] = useState(job?.type === 'outbound' ? 'OUTBOUND' : 'INBOUND');
  const [state, setState] = useState('IDLE');
  const [currentItem, setCurrentItem] = useState(null);
  const [targetGrids, setTargetGrids] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [imgError, setImgError] = useState(false);
  const [completedItemIds, setCompletedItemIds] = useState([]);
  const [visionReady, setVisionReady] = useState(false);

  const lang = initialLang.startsWith('en') ? 'en' : 'zh';

  const speak = (zhText, enText) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = lang === 'zh' ? zhText : enText;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const t = (key) => {
    const zh = {
      overlay_error: '摄像头未开启：请先检查后端服务是否运行 (http://127.0.0.1:8000)。',
      overlay_idle: '摄像头待机：正在自动获取空托盘基准图像...',
      lang_toggle: '中文 / EN',
      title: 'VLM 视觉定位原型系统',
      subtitle: '基于 OpenCV 差分算法的存取件空间数字化管理 Demo',
      reset: '重新开始 / 清空数据',
      panel_title: '系统控制面板',
      inbound_label: '入库',
      outbound_label: '出库',
      pending_inbound_label: '待入库',
      pending_outbound_label: '待出库',
      scan_bind_label: '1. 扫码绑定',
      pick_request_label: '1. 发起取料',
      hand_in_label: '2. 人手进入（红外遮挡 → 动作中）',
      place_done_label: '3. 放置完成 (触发差分计算)',
      pick_done_label: '3. 取料完成 (触发逆向差分验证)',
      camera_title: '实时摄像头与虚拟网格叠加 (Top-down View)',
      inventory_title: '库存清单 (Inventory)',
      th_id: 'ID',
      th_item: '物品名称',
      th_tray: '托盘号',
      th_grid: '网格 (X,Y)',
      no_data: '暂无库存数据',
      legend_inbound_item: '已入库物品',
      legend_target_outbound: '当前待取料目标 (仅出库模式)',
      reset_confirm: '确定要清空所有数据并重新开始吗？',
      item_id_label: '料号',
      tray_id_label: '托盘号',
      pick_item_id_label: '需取料号',
      pick_here: '取这里',
    };
    const en = {
      overlay_error: 'Camera inactive: Please check backend at http://127.0.0.1:8000.',
      overlay_idle: 'Camera standby: Automatically fetching empty tray baseline...',
      lang_toggle: 'EN / 中文',
      title: 'VLM Vision Localization Prototype',
      subtitle: 'OpenCV difference-based storage/picking digitization demo',
      reset: 'Restart / Clear Data',
      panel_title: 'Control Panel',
      inbound_label: 'Inbound',
      outbound_label: 'Outbound',
      pending_inbound_label: 'Pending Inbound',
      pending_outbound_label: 'Pending Outbound',
      scan_bind_label: '1. Scan & Bind (SCANNING)',
      pick_request_label: '1. Request Pick (PICK_REQUESTED)',
      hand_in_label: '2. Hand In (IR blocked -> ACTION)',
      place_done_label: '3. Placement Done (Run Diff)',
      pick_done_label: '3. Pick Done (Reverse Diff Verify)',
      camera_title: 'Live Camera with Virtual Grid (Top-down View)',
      inventory_title: 'Inventory',
      th_id: 'ID',
      th_item: 'Item',
      th_tray: 'Tray',
      th_grid: 'Grid (X,Y)',
      no_data: 'No data',
      legend_inbound_item: 'Stored Items',
      legend_target_outbound: 'Current Pick Target (Outbound only)',
      reset_confirm: 'Clear all data and restart?',
      item_id_label: 'Item ID',
      tray_id_label: 'Tray ID',
      pick_item_id_label: 'Pick Item ID',
      pick_here: 'Pick Here',
    };
    return (lang === 'zh' ? zh : en)[key];
  };
  const stateLabel = (s) => {
    const zh = {
      IDLE: '空闲',
      TRAY_OPENED: '托盘已弹出',
      SCANNING: '扫码绑定',
      PICK_REQUESTED: '已发起取料',
      BASELINE: '基线',
      ACTION: '动作中',
      TRIGGER: '触发',
      DIFF_CALC: '差分计算',
      VERIFYING: '验证中',
      BINDING: '绑定入库',
    };
    const en = {
      IDLE: 'IDLE',
      TRAY_OPENED: 'TRAY_OPENED',
      SCANNING: 'SCANNING',
      PICK_REQUESTED: 'PICK_REQUESTED',
      BASELINE: 'BASELINE',
      ACTION: 'ACTION',
      TRIGGER: 'TRIGGER',
      DIFF_CALC: 'DIFF_CALC',
      VERIFYING: 'VERIFYING',
      BINDING: 'BINDING',
    };
    const dict = lang === 'zh' ? zh : en;
    return dict[s] || s;
  };
  
  const displayPendingItems = (pendingItems || []).filter(item => !completedItemIds.includes(item.id));

  // Mock inputs driven by parent data
  const [mockItemId, setMockItemId] = useState(displayPendingItems?.[0]?.itemNo || '');
  const [trayId, setTrayId] = useState(job?.bin || '');
  const [pickItemId, setPickItemId] = useState(displayPendingItems?.[0]?.itemNo || '');
  const [currentBin, setCurrentBin] = useState('');
  const [currentCoords, setCurrentCoords] = useState('');
  
  // 新增：实际操作数量状态
  const [actualQty, setActualQty] = useState(displayPendingItems?.[0]?.qty || 0);

  const autoOpened = useRef(false);
  const sessionStarted = useRef(null);

  // Reset local completion state if job ID changes
  useEffect(() => {
    if (job?.id) {
      setCompletedItemIds([]);
    }
  }, [job?.id]);

  // 监听外部数据变化及本地完成状态变化
  useEffect(() => {
    if (job) {
      setMode(job.type === 'outbound' ? 'OUTBOUND' : 'INBOUND');
      setTrayId(job.bin || '');
    }
    if (displayPendingItems && displayPendingItems.length > 0) {
      setMockItemId(displayPendingItems[0].itemNo);
      setPickItemId(displayPendingItems[0].itemNo);
      setCurrentBin(displayPendingItems[0].bin || '');
      setCurrentCoords(displayPendingItems[0].x && displayPendingItems[0].y ? `(${displayPendingItems[0].x}, ${displayPendingItems[0].y})` : '');
      setActualQty(displayPendingItems[0].qty); // 默认带出需求数量
    } else {
      setMockItemId('');
      setPickItemId('');
      setActualQty(0);
      setCurrentBin('');
      setCurrentCoords('');
    }
  }, [job, displayPendingItems.length]); // Use length to avoid infinite loop but trigger on change

  useEffect(() => {
    if (!job?.id || sessionStarted.current === job.id) return;

    sessionStarted.current = job.id;
    autoOpened.current = true;
    const nextMode = job.type === 'outbound' ? 'OUTBOUND' : 'INBOUND';
    setMode(nextMode);
    setState('TRAY_OPENED');
    setVisionReady(true);

    axios.post(`${API_URL}/event/vision_session`, {
      mode: nextMode,
      tray_id: job.bin || job.tray || '',
    })
      .then(() => fetchState())
      .catch(e => {
        console.error('Vision session start failed:', e);
        setVisionReady(true);
      });
  }, [job?.id]);

  // 用一个 ref 记录是否已经报过错，避免控制台刷屏
  const hasLoggedError = useRef(false);

  // Configure axios to not throw unhandled promise rejections to the global console for our specific endpoint
  useEffect(() => {
    // Add an interceptor to globally catch and suppress network errors for this component's polling
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        // We handle it in our try/catch blocks, we don't want the browser to log it as uncaught
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const fetchState = async () => {
    try {
      // 只有在状态不为 IDLE 时（即真正发起了业务请求后），或者没有报过错时，才去向后端拉取状态。
      // 这样能避免一进入页面还没启动后端时就不停地抛出浏览器底层 ERR_CONNECTION_REFUSED 错误
      if (state === 'IDLE' && hasLoggedError.current) {
        return;
      }

      // 通过 validateStatus 覆盖所有的报错抛出，防止被浏览器底层捕获拦截，并且我们自己用原生 fetch 替代 axios 做轮询避免底层报错抛出
      const res = await fetch(`${API_URL}/state`, { method: 'GET', mode: 'cors' }).catch(() => null);
      
      // 如果 fetch 直接因为网络层挂了返回 null，直接进报错逻辑
      if (!res || !res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      
      setMode(data.mode);
      setState(data.state);
      setCurrentItem(data.current_item);
      setTargetGrids(data.target_grids || []);
      setInventory(data.inventory);
      
      // 成功连接后，重置报错记录
      hasLoggedError.current = false;
    } catch (error) {
      if (!hasLoggedError.current) {
        console.warn('SmartWorkStation Backend not reachable. Ensure FastAPI is running on port 8000.');
        hasLoggedError.current = true;
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
  }, []);

  // 自动触发托盘弹出（获取基线图像）
  useEffect(() => {
    if (state === 'IDLE' && !autoOpened.current) {
      autoOpened.current = true;
      // 等待 500ms 确保组件挂载稳定后发起请求
      setTimeout(() => {
        axios.post(`${API_URL}/event/tray_open`)
          .then(() => {
            fetchState();
          })
          .catch(e => {
            console.error("Auto tray open failed:", e);
            autoOpened.current = false; // 失败的话允许下次重试
          });
      }, 500);
    }
  }, [state]);

  const handleModeChange = async (newMode) => {
    try {
      await axios.post(`${API_URL}/event/mode`, { mode: newMode });
      setMode(newMode);
      fetchState();
    } catch (e) {
      alert(e.response?.data?.detail || 'Error');
    }
  };

  const handleScan = async () => {
    try {
      const item = displayPendingItems.find(i => i.itemNo === mockItemId);
      await axios.post(`${API_URL}/event/scan`, { 
        item_id: mockItemId, 
        tray_id: trayId,
        expected_x: item ? item.x - 1 : 0,
        expected_y: item ? item.y - 1 : 0
      });
      
      if (item) {
        setCurrentBin(item.bin);
        setCurrentCoords(`(${item.x}, ${item.y})`);
        // 发送 Modula 亮灯指令
        await axios.post(`${API_URL}/modula/light`, { tray_id: trayId, bin_id: item.bin }).catch(() => {});
      }
      speak('扫码绑定成功，Bin位已亮灯', 'Scan and bind successful, bin lit up');
      fetchState();
    } catch (e) {
      const errMsg = e.response?.data?.detail || (e.code === 'ERR_NETWORK' ? '网络错误: 无法连接到视觉服务器(8000端口)' : 'Error');
      alert(errMsg);
      speak('操作失败', 'Operation failed');
    }
  };

  const handlePickRequest = async () => {
    try {
      const item = displayPendingItems.find(i => i.itemNo === pickItemId);
      await axios.post(`${API_URL}/event/pick`, {
        item_id: pickItemId,
        tray_id: trayId,
        expected_x: item ? item.x - 1 : undefined,
        expected_y: item ? item.y - 1 : undefined,
      });
      if (item) {
        setCurrentBin(item.bin);
        setCurrentCoords(`(${item.x}, ${item.y})`);
        // 发送 Modula 亮灯指令
        await axios.post(`${API_URL}/modula/light`, { tray_id: trayId, bin_id: item.bin }).catch(() => {});
      }
      speak('已发起取料，Bin位已亮灯', 'Pick requested, bin lit up');
      fetchState();
    } catch (e) {
      const errMsg = e.response?.data?.detail || (e.code === 'ERR_NETWORK' ? '网络错误: 无法连接到视觉服务器(8000端口)' : 'Error');
      alert(errMsg);
      if (e.response?.status === 404) {
        speak('库存中未找到该物品', 'Item not found in inventory');
      } else {
        speak('操作失败', 'Operation failed');
      }
    }
  };

  const handleTrayOpen = async () => {
    try {
      await axios.post(`${API_URL}/event/tray_open`);
      speak('托盘已弹出，请放入或取出物品', 'Tray opened, please place or pick the item');
      fetchState();
    } catch (e) {
      alert(e.response?.data?.detail || (e.code === 'ERR_NETWORK' ? '网络错误: 无法连接到视觉服务器(8000端口)' : 'Error'));
    }
  };

  const handleSensorIn = async () => {
    try {
      await axios.post(`${API_URL}/event/sensor_in`);
      fetchState();
    } catch (e) {
      alert(e.response?.data?.detail || (e.code === 'ERR_NETWORK' ? '网络错误: 无法连接到视觉服务器(8000端口)' : 'Error'));
    }
  };

  const handleSensorOut = async () => {
    try {
      const res = await axios.post(`${API_URL}/event/sensor_out`);
      alert(res.data.message);
      const msg = res.data.message || '';
      let isSuccess = false;
      if (msg.includes('Item bound')) {
        speak('成功入库', 'Successfully inbound');
        isSuccess = true;
      } else if (msg.includes('Successfully picked')) {
        speak('取料成功', 'Successfully picked');
        isSuccess = true;
      } else if (msg.includes('Warning')) {
        if (msg.includes('wrong bin')) {
          speak('警告，放入了错误的 Bin 位', 'Warning, wrong bin');
        } else {
          speak('警告，取错物品', 'Warning, wrong item picked');
        }
      } else if (msg.includes('No item')) {
        speak('未检测到物品变动', 'No item changes detected');
      } else {
        speak('操作完成', 'Operation completed');
      }
      
      // Update Bin coordinate from diff result directly
      const diffResult = res.data.diff_result; // format: [x, y]
      if (mode === 'INBOUND' && isSuccess && diffResult) {
        // Keep the existing bin and just append the actual coordinates recognized by vision
        setCurrentCoords(`(${diffResult[0] + 1}, ${diffResult[1] + 1})`);
      } else if (mode === 'OUTBOUND' && isSuccess) {
        // for outbound, if pick is successful, show picked from where (if backend returns it, otherwise generic success)
        setCurrentCoords(prev => prev ? `${prev} 提取成功` : '提取成功');
      }

      if (isSuccess) {
        // Record this item as completed
        const currentItemNo = mode === 'INBOUND' ? mockItemId : pickItemId;
        const targetItem = displayPendingItems.find(i => i.itemNo === currentItemNo);
        if (targetItem) {
          setCompletedItemIds(prev => {
            const next = [...prev, targetItem.id];
            if (next.length === pendingItems.length) {
              speak('当前托盘所有任务已完成，正在收回托盘', 'All tasks completed, returning tray');
              
              // 发送 Modula 收回托盘指令
              axios.post(`${API_URL}/modula/return_tray`, { tray_id: trayId }).catch(() => {});

              if (onJobCompleted) {
                setTimeout(() => onJobCompleted(), 3000);
              }
            }
            return next;
          });
        }
      }

      fetchState();
    } catch (e) {
      const errMsg = e.response?.data?.detail || (e.code === 'ERR_NETWORK' ? '网络错误: 无法连接到视觉服务器(8000端口)' : 'Error');
      alert(errMsg);
      speak('差分计算失败', 'Difference calculation failed');
    }
  };

  const handleReset = async () => {
    if (window.confirm(t('reset_confirm'))) {
      try {
          await axios.post(`${API_URL}/event/reset`);
          setTargetGrids([]);
          autoOpened.current = false; // 重置后允许重新自动获取基线
          fetchState();
        } catch (e) {
        alert(e.response?.data?.detail || (e.code === 'ERR_NETWORK' ? '网络错误: 无法连接到视觉服务器(8000端口)' : 'Error'));
      }
    }
  };

  // UI Helper
  const isIdle = state === 'IDLE';
  const canStartVisionAction = (state === 'TRAY_OPENED' || visionReady) && displayPendingItems.length > 0;
  const gridCellWidth = 100 / MODULA_GRID_COLUMNS;
  const gridCellHeight = 100 / MODULA_GRID_ROWS;
  const gridHighlightStates = ['TRAY_OPENED', 'SCANNING', 'PICK_REQUESTED', 'BASELINE', 'ACTION', 'TRIGGER', 'DIFF_CALC', 'VERIFYING', 'BINDING'];
  const canShowGridHighlights = gridHighlightStates.includes(state);
  const getGridPosition = (xValue, yValue, oneBased = true) => {
    const x = Number(xValue);
    const y = Number(yValue);

    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      return null;
    }

    const gridX = oneBased ? x - 1 : x;
    const gridY = oneBased ? y - 1 : y;

    if (gridX < 0 || gridX >= MODULA_GRID_COLUMNS || gridY < 0 || gridY >= MODULA_GRID_ROWS) {
      return null;
    }

    return { gridX, gridY };
  };
  const getTaskGridPosition = item => getGridPosition(item?.x, item?.y, true);
  const getInventoryGridPosition = item => (
    getGridPosition(item?.grid_x, item?.grid_y, false) || getGridPosition(item?.grid_x, item?.grid_y, true)
  );
  const getGridStyle = ({ gridX, gridY }) => ({
    left: `${gridX * gridCellWidth}%`,
    top: `${gridY * gridCellHeight}%`,
    width: `${gridCellWidth}%`,
    height: `${gridCellHeight}%`,
  });
  const getTaskItemKey = item => item ? (item.id ?? item.itemNo ?? `${item.bin}-${item.x}-${item.y}`) : '';
  const inboundTargetItem = mode === 'INBOUND'
    ? displayPendingItems.find(i => i.itemNo === mockItemId)
    : null;
  const outboundTargetItem = mode === 'OUTBOUND'
    ? displayPendingItems.find(i => i.itemNo === pickItemId)
    : null;
  const outboundTargetKey = getTaskItemKey(outboundTargetItem);

  return (
    <div className="h-full bg-gray-50 text-gray-900 font-sans p-4 flex flex-col">
      <div className="mb-4 flex justify-between items-center shrink-0">
        {onClose && (
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
            title={lang === 'zh' ? '返回 SAP 订单与队列' : 'Back to SAP Orders'}
          >
            <ArrowLeft className="w-5 h-5" />
            {lang === 'zh' ? '返回 SAP 订单与队列' : 'Back to SAP Orders'}
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
        {/* Left Column: Status and Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{t('panel_title')}</h2>
            
            <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
              <button 
                onClick={() => handleModeChange('INBOUND')}
                disabled={!isIdle && mode !== 'INBOUND'}
                className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                  mode === 'INBOUND' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" /> {t('inbound_label')}
              </button>
              <button 
                onClick={() => handleModeChange('OUTBOUND')}
                disabled={!isIdle && mode !== 'OUTBOUND'}
                className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                  mode === 'OUTBOUND' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700 disabled:opacity-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> {t('outbound_label')}
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className={`px-4 py-2 rounded-full font-bold text-white shadow-sm ${
                state === 'IDLE' ? 'bg-gray-400' :
                state === 'TRAY_OPENED' ? 'bg-indigo-500' :
                state === 'SCANNING' || state === 'PICK_REQUESTED' ? 'bg-blue-500' :
                state === 'BASELINE' ? 'bg-purple-500' :
                state === 'ACTION' ? 'bg-orange-500' :
                state === 'TRIGGER' || state === 'DIFF_CALC' || state === 'VERIFYING' ? 'bg-yellow-500' :
                state === 'BINDING' ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                {stateLabel(state)}
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
                  <ControlBtn 
                icon={<ScanLine />} label={t('scan_bind_label')} 
                onClick={handleScan} disabled={!canStartVisionAction} 
                active={canStartVisionAction} 
              />
                  <div className="pl-4 text-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">{t('tray_id_label')}:</span>
                      <span className="font-bold text-gray-800 text-base bg-gray-100 px-3 py-1 rounded w-full">{trayId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">{t('item_id_label')}:</span>
                      <input 
                        type="text" 
                        value={mockItemId} 
                        onChange={e => setMockItemId(e.target.value)}
                        className="border-2 border-indigo-300 rounded px-3 py-1 flex-1 text-base font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                        disabled={!canStartVisionAction}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">Bin:</span>
                      <span className="font-mono text-green-600 font-bold text-base bg-green-50 px-3 py-1 rounded w-full">{currentBin || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">坐标:</span>
                      <span className="font-mono text-blue-600 font-bold text-base bg-blue-50 px-3 py-1 rounded w-full">{currentCoords || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-500 w-20 font-bold">实际操作量:</span>
                      <input 
                        type="number" 
                        value={actualQty} 
                        onChange={e => setActualQty(e.target.value)}
                        className="border-2 border-indigo-300 rounded px-3 py-1 flex-1 text-base font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                        min="1"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <ControlBtn 
                    icon={<ScanLine />} label={t('pick_request_label')} 
                    onClick={handlePickRequest} disabled={!canStartVisionAction} 
                    active={canStartVisionAction} 
                  />
                  <div className="pl-4 text-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">{t('tray_id_label')}:</span>
                      <span className="font-bold text-gray-800 text-base bg-gray-100 px-3 py-1 rounded w-full">{trayId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">{t('pick_item_id_label')}:</span>
                      <input 
                        type="text" 
                        value={pickItemId} 
                        onChange={e => setPickItemId(e.target.value)}
                        className="border-2 border-indigo-300 rounded px-3 py-1 flex-1 text-base font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                        disabled={!canStartVisionAction}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">Bin:</span>
                      <span className="font-mono text-green-600 font-bold text-base bg-green-50 px-3 py-1 rounded w-full">{currentBin || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">坐标:</span>
                      <span className="font-mono text-blue-600 font-bold text-base bg-blue-50 px-3 py-1 rounded w-full">{currentCoords || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-500 w-20 font-bold">实际操作量:</span>
                      <input 
                        type="number" 
                        value={actualQty} 
                        onChange={e => setActualQty(e.target.value)}
                        className="border-2 border-indigo-300 rounded px-3 py-1 flex-1 text-base font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                        min="1"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 待扫描物料列表 */}
              {displayPendingItems && displayPendingItems.length > 0 && (
                <div className="pl-4 mt-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center justify-between">
                      待扫描物料
                      <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{displayPendingItems.length}</span>
                    </h4>
                    <ul className="text-sm space-y-1 max-h-32 overflow-y-auto pr-1">
                      {displayPendingItems.map((item) => {
                        const isCurrent = mode === 'INBOUND' ? item.itemNo === mockItemId : item.itemNo === pickItemId;
                        return (
                          <li key={item.id} className={`flex justify-between items-center px-2 py-1 rounded ${isCurrent ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <span className="truncate pr-2" title={item.itemNo}>{item.itemNo}</span>
                            <span className="text-xs shrink-0 bg-white/50 px-1.5 py-0.5 rounded text-gray-500">x{item.qty}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
              {displayPendingItems.length === 0 && pendingItems.length > 0 && (
                <div className="pl-4 mt-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-start gap-2">
                    <span className="text-lg">✅</span>
                    <p>当前托盘所有物料已处理完毕，3秒后自动收回并返回 SAP 页面进行下一步操作。</p>
                  </div>
                </div>
              )}

              <ControlBtn 
                icon={<Hand />} label={t('hand_in_label')} 
                onClick={handleSensorIn} disabled={state !== 'SCANNING' && state !== 'PICK_REQUESTED'} 
                active={state === 'SCANNING' || state === 'PICK_REQUESTED'} 
              />
              
              <ControlBtn 
                icon={<Play className="rotate-180" />} 
                label={mode === 'INBOUND' ? t('place_done_label') : t('pick_done_label')}
                onClick={handleSensorOut} disabled={state !== 'ACTION'} 
                active={state === 'ACTION'} 
              />
            </div>
            
            {state === 'ACTION' && mode === 'INBOUND' && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-start gap-2">
                <Info className="w-5 h-5 shrink-0" />
                <p>请在右侧真实的摄像头视野中<strong>放入</strong>物品，放置稳定后，点击“放置完成”。</p>
              </div>
            )}

            {state === 'ACTION' && mode === 'OUTBOUND' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                <Info className="w-5 h-5 shrink-0" />
                <p>请根据右侧画面提示的<strong className="text-red-600">🎯 取料网格</strong>，<strong>拿走</strong>对应的物品，手拿开后点击“取料完成”。</p>
              </div>
            )}
          </div>
          
          {/* Inventory List */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">{t('inventory_title')}</h2>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="pb-2 font-medium">{t('th_id')}</th>
                    <th className="pb-2 font-medium">{t('th_item')}</th>
                    <th className="pb-2 font-medium">{t('th_tray')}</th>
                    <th className="pb-2 font-medium">{t('th_grid')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-2 text-gray-500">#{item.id}</td>
                      <td className="py-2 font-medium text-gray-800">{item.item_id}</td>
                      <td className="py-2 text-gray-600">{item.tray_id}</td>
                      <td className="py-2">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                          ({item.grid_x}, {item.grid_y})
                        </span>
                      </td>
                    </tr>
                  ))}
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-400">{t('no_data')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
            <h2 className="text-xl font-semibold mb-4">{t('camera_title')}</h2>
            
            <div className="relative w-full max-w-2xl mx-auto border-4 border-gray-800 rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
              {/* Live Camera Feed */}
              <img 
                src={`${API_URL}/video_feed?t=${job?.id || 'vision'}`} 
                alt="Live Camera Feed" 
                className={`absolute inset-0 w-full h-full object-cover ${imgError ? 'hidden' : 'block'}`}
                onError={() => setImgError(true)}
                onLoad={() => setImgError(false)}
              />
              
              {state === 'IDLE' && !visionReady && !imgError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-20 bg-gray-100/80 p-8 text-center backdrop-blur-sm">
                  <p className="text-lg font-medium">{t('overlay_idle')}</p>
                </div>
              )}

              {imgError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 z-20 bg-red-50 p-8 text-center backdrop-blur-sm">
                  <p className="text-lg font-medium">{t('overlay_error')}</p>
                </div>
              )}

              {/* Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10" style={{
                backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: `${gridCellWidth}% ${gridCellHeight}%` // Assume 17x2 virtual grid based on backend dynamic splitting
              }}>
                {/* Render Existing Items */}
                {inventory.map(item => {
                  const gridPosition = getInventoryGridPosition(item);
                  if (!gridPosition) return null;

                  // Check if this item is a target for picking
                  const isTarget = mode === 'OUTBOUND' && targetGrids.some(t => t.id === item.id);
                  
                  const normalizedTrayId = normalizeTrayId(item.tray_id);
                  const binNum = getBinNumberFromGrid(gridPosition.gridX, gridPosition.gridY);
                  const binString = formatBinId(normalizedTrayId, binNum);

                  return (
                    <div key={item.id} 
                         className={`absolute border-2 rounded-sm shadow-md flex flex-col items-center justify-center text-white text-xs font-bold transition-all ${
                           isTarget ? 'bg-yellow-500/60 border-yellow-400 animate-pulse z-20' : 'bg-blue-500/80 border-blue-700 z-10'
                         }`}
                         style={getGridStyle(gridPosition)}
                         title={`${item.item_id} at (${gridPosition.gridX + 1}, ${gridPosition.gridY + 1}) - ${binString}`}>
                      <span className="text-lg">{isTarget ? '🎯' : '📦'}</span>
                      <span className="text-[10px] mt-1 bg-black/50 px-1 rounded">{binString}</span>
                      {isTarget && <span className="text-[10px] text-yellow-100 mt-0.5">{t('pick_here')}</span>}
                    </div>
                  );
                })}

                {/* Render outbound task items directly from the SAP task data. */}
                {mode === 'OUTBOUND' && canShowGridHighlights && displayPendingItems.map(item => {
                  const gridPosition = getTaskGridPosition(item);
                  if (!gridPosition) return null;

                  const isTarget = getTaskItemKey(item) === outboundTargetKey;

                  return (
                    <div key={`pending-${getTaskItemKey(item)}`}
                         className={`absolute border-2 rounded-sm shadow-md flex flex-col items-center justify-center text-white text-xs font-bold transition-all ${
                           isTarget ? 'bg-yellow-500/60 border-yellow-400 animate-pulse z-30' : 'bg-blue-500/80 border-blue-700 z-20'
                         }`}
                         style={getGridStyle(gridPosition)}
                         title={`${item.itemNo} at (${item.x}, ${item.y}) - ${item.bin}`}>
                      <span className="text-lg">{isTarget ? '🎯' : '📦'}</span>
                      <span className="text-[10px] mt-1 bg-black/50 px-1 rounded">{item.bin}</span>
                      {isTarget && <span className="text-[10px] text-yellow-100 mt-0.5">{t('pick_here')}</span>}
                    </div>
                  );
                })}

                {/* Render inbound target directly from the SAP task data. */}
                {mode === 'INBOUND' && canShowGridHighlights && inboundTargetItem && (
                  (() => {
                    const gridPosition = getTaskGridPosition(inboundTargetItem);
                    if (!gridPosition) return null;

                    return (
                      <div className="absolute border-2 border-dashed border-green-400 bg-green-500/20 rounded-sm flex flex-col items-center justify-center text-white text-xs font-bold animate-pulse z-30"
                           style={getGridStyle(gridPosition)}
                           title={`${inboundTargetItem.itemNo} at (${inboundTargetItem.x}, ${inboundTargetItem.y}) - ${inboundTargetItem.bin}`}>
                        <span className="text-lg opacity-80">📥</span>
                        <span className="text-[10px] mt-1 bg-black/50 px-1 rounded">{inboundTargetItem.bin}</span>
                        <span className="text-[10px] text-green-200 mt-0.5">放入此Bin位</span>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 border border-blue-700 rounded-sm"></div>
                <span>{t('legend_inbound_item')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 border border-yellow-400 rounded-sm animate-pulse"></div>
                <span>{t('legend_target_outbound')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-dashed border-green-400 bg-green-500/20 rounded-sm animate-pulse"></div>
                <span>待放入目标 Bin 位</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlBtn({ icon, label, onClick, disabled, active }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
        disabled 
          ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
          : active 
            ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg'
            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
