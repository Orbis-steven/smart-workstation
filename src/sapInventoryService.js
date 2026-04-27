import { getGridPositionFromBin, normalizeBinId, normalizeItemLocation, normalizeTrayId } from './trayNaming';

function normalizeTimestamp(value) {
  if (value) {
    return value;
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function normalizeInventoryRecord(record) {
  const normalizedLocation = normalizeItemLocation(record);
  const position = getGridPositionFromBin(normalizedLocation.bin, normalizedLocation.tray);
  return {
    ...record,
    ...normalizedLocation,
    x: record.x ?? position.x ?? null,
    y: record.y ?? position.y ?? null,
    qty: record.qty ?? 0,
    updatedAt: normalizeTimestamp(record.updatedAt),
  };
}

function normalizeLocationRecord(record) {
  const normalizedLocation = normalizeItemLocation(record);
  const position = getGridPositionFromBin(normalizedLocation.bin, normalizedLocation.tray);
  return {
    ...record,
    ...normalizedLocation,
    x: record.x ?? position.x ?? null,
    y: record.y ?? position.y ?? null,
    qty: record.qty ?? '-',
    updatedAt: normalizeTimestamp(record.updatedAt),
  };
}

async function fetchTrayBinsFromSap() {
  // SAP 接口预留点 1:
  // 输入托盘号，返回该托盘下全部 Bin 列表。
  throw new Error('SAP tray inventory service is not configured yet.');
}

async function fetchBinMaterialsFromSap() {
  // SAP 接口预留点 2:
  // 输入 Bin 列表，返回每个 Bin 内的物料与数量。
  throw new Error('SAP bin inventory service is not configured yet.');
}

export async function getTrayInventoryByTray({
  trayId,
  provider = 'mock',
  inventorySnapshot = [],
}) {
  const normalizedTrayId = normalizeTrayId(trayId);
  if (!normalizedTrayId) {
    return [];
  }

  if (provider === 'sap') {
    // 后续接 SAP 时，仅替换这里的两段查询即可：
    // 1. tray -> bins
    // 2. bins -> materials
    const bins = await fetchTrayBinsFromSap(normalizedTrayId);
    const materials = await fetchBinMaterialsFromSap(bins);
    return materials.map(normalizeInventoryRecord);
  }

  return inventorySnapshot
    .map(normalizeInventoryRecord)
    .filter(record => record.tray === normalizedTrayId)
    .sort((a, b) => a.bin.localeCompare(b.bin) || a.itemNo.localeCompare(b.itemNo));
}

export async function getItemLocationByItemNo({
  itemNo,
  provider = 'mock',
  itemLocationMapping = {},
}) {
  const normalizedItemNo = String(itemNo || '').trim().toUpperCase();
  if (!normalizedItemNo) {
    return null;
  }

  if (provider === 'sap') {
    // SAP 物料库位查询预留点:
    // 输入物料号，返回唯一的 tray/bin/x/y/qty。
    throw new Error('SAP item location service is not configured yet.');
  }

  const directHit = itemLocationMapping[normalizedItemNo];
  if (directHit) {
    return normalizeLocationRecord(directHit);
  }

  const fallbackHit = Object.values(itemLocationMapping).find(
    record => String(record.itemNo || '').trim().toUpperCase() === normalizedItemNo,
  );
  return fallbackHit ? normalizeLocationRecord(fallbackHit) : null;
}

export function transferMockItemLocation({
  itemNo,
  tray,
  bin,
  itemLocationMapping = {},
  inventorySnapshot = [],
}) {
  const normalizedItemNo = String(itemNo || '').trim().toUpperCase();
  const normalizedTray = normalizeTrayId(tray);
  const normalizedBin = normalizeBinId(bin, normalizedTray);
  const position = getGridPositionFromBin(normalizedBin, normalizedTray);
  const currentRecord = itemLocationMapping[normalizedItemNo];

  if (!normalizedItemNo || !normalizedTray || !normalizedBin || !position.x || !position.y) {
    throw new Error('请输入有效的 Tray 和 Bin。');
  }

  const updatedAt = normalizeTimestamp();
  const nextLocationRecord = normalizeLocationRecord({
    ...(currentRecord || { itemNo: normalizedItemNo, description: 'Material location mapping', qty: '-' }),
    itemNo: normalizedItemNo,
    tray: normalizedTray,
    bin: normalizedBin,
    x: position.x,
    y: position.y,
    updatedAt,
  });

  const nextItemLocationMapping = {
    ...itemLocationMapping,
    [normalizedItemNo]: nextLocationRecord,
  };

  const nextInventorySnapshot = [...inventorySnapshot];
  const sourceInventoryIndex = nextInventorySnapshot.findIndex(record => {
    const normalizedRecord = normalizeInventoryRecord(record);
    return normalizedRecord.itemNo === normalizedItemNo
      && normalizedRecord.tray === currentRecord?.tray
      && normalizedRecord.bin === currentRecord?.bin;
  });

  const movedInventoryRecord = normalizeInventoryRecord({
    ...(sourceInventoryIndex >= 0 ? nextInventorySnapshot[sourceInventoryIndex] : nextLocationRecord),
    itemNo: normalizedItemNo,
    description: currentRecord?.description || nextLocationRecord.description,
    tray: normalizedTray,
    bin: normalizedBin,
    x: position.x,
    y: position.y,
    updatedAt,
  });

  if (sourceInventoryIndex >= 0) {
    nextInventorySnapshot[sourceInventoryIndex] = movedInventoryRecord;
  } else {
    nextInventorySnapshot.push(movedInventoryRecord);
  }

  return {
    record: nextLocationRecord,
    nextItemLocationMapping,
    nextInventorySnapshot: nextInventorySnapshot
      .map(normalizeInventoryRecord)
      .sort((a, b) => a.tray.localeCompare(b.tray) || a.bin.localeCompare(b.bin) || a.itemNo.localeCompare(b.itemNo)),
  };
}
