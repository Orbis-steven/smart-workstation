import { normalizeTrayId } from '../modula/trayNaming';

export function formatLocalDate(offsetDays = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeVoiceCode(value) {
  if (!value) {
    return '';
  }

  return String(value).trim().replace(/[。．，,；;！？!?]/g, '').replace(/\s+/g, '');
}

export function describeSearchFilters(filters = {}) {
  if (filters.trayInventory) {
    return `托盘 ${normalizeTrayId(filters.trayInventory) || filters.trayInventory} 的库存`;
  }

  if (filters.itemNo) {
    return `物料号 ${filters.itemNo} 的库位信息`;
  }

  const parts = [];
  const dateValue = filters.date?.[0];
  if (dateValue) parts.push(dateValue === formatLocalDate(0) ? '今天' : dateValue);
  if (filters.jobType === 'outbound') parts.push('出库任务');
  else if (filters.jobType === 'inbound') parts.push('入库任务');
  else parts.push('任务');
  if (filters.toNo) parts.push(`TO ${filters.toNo}`);
  if (filters.workOrderNo) parts.push(`工单 ${filters.workOrderNo}`);
  if (filters.deliveryNo) parts.push(`交货单 ${filters.deliveryNo}`);
  return parts.join('');
}

export function buildVoiceSearchSummary(data = [], filters = {}) {
  if (filters.trayInventory) {
    const trayId = normalizeTrayId(filters.trayInventory) || filters.trayInventory;
    if (!data.length) return `托盘 ${trayId} 没有查询到库存。`;
    const preview = data.slice(0, 3).map((item) => `${item.itemNo}(${item.bin})`).join('，');
    return `托盘 ${trayId} 当前共有 ${data.length} 条库存记录。${preview ? `包括 ${preview}${data.length > 3 ? ' 等' : ''}。` : ''}`;
  }

  if (filters.itemNo) {
    if (!data.length) return `没有找到物料号 ${filters.itemNo} 的库位信息。`;
    const record = data[0];
    return `已找到物料号 ${record.itemNo}，所在托盘 ${record.tray || '-'}，Bin ${record.bin || '-'}，坐标 ${record.x ?? '-'}, ${record.y ?? '-'}。`;
  }

  const dateValue = filters.date?.[0];
  const dateLabel = dateValue ? (dateValue === formatLocalDate(0) ? '今天' : dateValue) : '';
  const jobLabel = filters.jobType === 'outbound' ? '出库任务' : filters.jobType === 'inbound' ? '入库任务' : '任务';
  const prefix = `${dateLabel}${jobLabel}`.trim() || '当前条件';
  if (!data.length) return `${prefix}没有查询到结果。`;

  const groupedByTo = new Map();
  data.forEach((row) => {
    const key = row.toNo || '-';
    if (!groupedByTo.has(key)) groupedByTo.set(key, { toNo: key, count: 0 });
    groupedByTo.get(key).count += 1;
  });

  const toList = Array.from(groupedByTo.values());
  const preview = toList.slice(0, 3).map((item) => `${item.toNo}（${item.count}项）`).join('，');
  return `${prefix}共有 ${toList.length} 个 TO，${data.length} 个物料项。${preview ? `包括 ${preview}${toList.length > 3 ? ' 等' : ''}。` : ''}`;
}

export function extractVoiceDate(rawText) {
  const compactText = rawText.replace(/\s+/g, '');
  if (/今天|今日|当天/.test(compactText)) return formatLocalDate(0);
  if (/昨天|昨日/.test(compactText)) return formatLocalDate(-1);
  if (/明天/.test(compactText)) return formatLocalDate(1);

  const fullDateMatch = rawText.match(/(20\d{2})[年/-](\d{1,2})[月/-](\d{1,2})/);
  if (fullDateMatch) return `${fullDateMatch[1]}-${String(fullDateMatch[2]).padStart(2, '0')}-${String(fullDateMatch[3]).padStart(2, '0')}`;

  const monthDayMatch = rawText.match(/(\d{1,2})月(\d{1,2})日?/);
  if (monthDayMatch) {
    const year = new Date().getFullYear();
    return `${year}-${String(monthDayMatch[1]).padStart(2, '0')}-${String(monthDayMatch[2]).padStart(2, '0')}`;
  }

  return '';
}

export function parseVoiceCommand(rawText) {
  const spokenText = String(rawText || '').trim();
  const compactText = spokenText.replace(/\s+/g, '');

  if (!spokenText) return { type: 'unknown' };
  if (/(开启|打开).*(图像识别|视觉模式|视觉工作台)/.test(compactText)) return { type: 'toggleVision', enabled: true };
  if (/(关闭|退出).*(图像识别|视觉模式|视觉工作台)/.test(compactText)) return { type: 'toggleVision', enabled: false };
  if (/(开启|打开).*(语音提示|语音播报)/.test(compactText)) return { type: 'toggleVoicePrompt', enabled: true };
  if (/(关闭|停止).*(语音提示|语音播报)/.test(compactText)) return { type: 'toggleVoicePrompt', enabled: false };
  if (/(取消全选|清空选择|取消选择)/.test(compactText)) return { type: 'clearSelection' };
  if (/全选/.test(compactText)) return { type: 'selectAll' };
  if (/(下发|执行|开始|发起).*(出库)/.test(compactText)) return { type: 'submitJob', jobType: 'outbound' };
  if (/(下发|执行|开始|发起).*(入库)/.test(compactText)) return { type: 'submitJob', jobType: 'inbound' };

  const looksLikeSearch = /(查|查询|筛选|搜索|看看|显示|列出|找|任务|物料号|工单|交货单|有哪些)/.test(compactText);
  if (!looksLikeSearch) return { type: 'unknown' };

  const filters = {};
  if (/出库/.test(compactText)) filters.jobType = 'outbound';
  else if (/入库/.test(compactText)) filters.jobType = 'inbound';

  const dateValue = extractVoiceDate(spokenText);
  if (dateValue) filters.date = [dateValue];

  const itemNoMatch = spokenText.match(/物料号(?:是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
  if (itemNoMatch) {
    filters.itemNo = normalizeVoiceCode(itemNoMatch[1]);
    return { type: 'search', filters };
  }

  const toNoMatch = spokenText.match(/\bTO(?:号)?(?:是|为|[:：]|\s|-)?\s*([A-Za-z0-9-]+)/i);
  if (toNoMatch) filters.toNo = normalizeVoiceCode(toNoMatch[1]).toUpperCase();

  const workOrderMatch = spokenText.match(/(?:工单号|工单)(?:是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
  if (workOrderMatch) filters.workOrderNo = normalizeVoiceCode(workOrderMatch[1]).toUpperCase();

  const deliveryMatch = spokenText.match(/(?:交货单号|交货单)(?:是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
  if (deliveryMatch) filters.deliveryNo = normalizeVoiceCode(deliveryMatch[1]).toUpperCase();

  const trayInventoryMatch = spokenText.match(/(?:托盘|层|tray)(?:号|是|为|[:：]|\s)?\s*([A-Za-z0-9-]+)/i);
  if (trayInventoryMatch && /(库存|库位|有哪些物料|哪些物料)/.test(compactText)) {
    filters.trayInventory = normalizeVoiceCode(trayInventoryMatch[1]).toUpperCase();
    return { type: 'search', filters };
  }

  return { type: 'search', filters };
}
