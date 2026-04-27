import { getGridPositionFromBin, normalizeBinId, normalizeItemLocation, normalizeTrayId } from '../modula/trayNaming';
import {
  queryBinMaterialsFromSap,
  queryMaterialLocationFromSap,
  queryTrayBinsFromSap,
  updateMaterialLocationInSap,
} from './sapGateway';

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
    const bins = await queryTrayBinsFromSap(normalizedTrayId);
    const materials = await queryBinMaterialsFromSap(bins);
    return materials.map(normalizeInventoryRecord);
  }

  return inventorySnapshot
    .map(normalizeInventoryRecord)
    .filter((record) => record.tray === normalizedTrayId)
    .sort((left, right) => left.bin.localeCompare(right.bin) || left.itemNo.localeCompare(right.itemNo));
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
    return queryMaterialLocationFromSap(normalizedItemNo);
  }

  const directHit = itemLocationMapping[normalizedItemNo];
  if (directHit) {
    return normalizeLocationRecord(directHit);
  }

  const fallbackHit = Object.values(itemLocationMapping).find(
    (record) => String(record.itemNo || '').trim().toUpperCase() === normalizedItemNo,
  );
  return fallbackHit ? normalizeLocationRecord(fallbackHit) : null;
}

export async function updateItemLocation({
  itemNo,
  tray,
  bin,
  provider = 'mock',
  itemLocationMapping = {},
  inventorySnapshot = [],
}) {
  if (provider === 'sap') {
    return updateMaterialLocationInSap({ itemNo, tray, bin });
  }

  return transferMockItemLocation({
    itemNo,
    tray,
    bin,
    itemLocationMapping,
    inventorySnapshot,
  });
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
  const sourceInventoryIndex = nextInventorySnapshot.findIndex((record) => {
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
      .sort((left, right) => left.tray.localeCompare(right.tray) || left.bin.localeCompare(right.bin) || left.itemNo.localeCompare(right.itemNo)),
  };
}
