import {
  formatBinId,
  getRandomGridPosition,
  getRandomTrayId,
  normalizeItemLocation,
  normalizeTrayId,
} from '../modula/trayNaming';
import { queryOpenTasksFromSap } from './sapGateway';
import { getItemLocationByItemNo, getTrayInventoryByTray } from './sapInventoryService';

export const SAP_QUERY_MODES = {
  TASKS: 'toQuery',
  ITEM_LOCATION: 'itemLocation',
  TRAY_INVENTORY: 'trayInventory',
};

export function syncInventorySnapshotWithOrders({ orders = {}, inventorySnapshot = [] }) {
  const nextSnapshot = [...inventorySnapshot];
  const existingKeys = new Set(
    nextSnapshot.map((record) => {
      const normalizedRecord = normalizeItemLocation(record);
      return `${normalizedRecord.itemNo}::${normalizedRecord.bin}`;
    }),
  );

  Object.values(orders).forEach((toData) => {
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

  return nextSnapshot.sort((left, right) => (
    left.tray.localeCompare(right.tray)
    || left.bin.localeCompare(right.bin)
    || left.itemNo.localeCompare(right.itemNo)
  ));
}

export async function buildTrayInventoryRows({
  trayId,
  provider,
  inventorySnapshot,
}) {
  const normalizedTrayId = normalizeTrayId(trayId);
  if (!normalizedTrayId) {
    return [];
  }

  const inventoryItems = await getTrayInventoryByTray({
    trayId: normalizedTrayId,
    provider,
    inventorySnapshot,
  });

  return inventoryItems.map((item) => ({
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
}

export function buildItemLocationRows(record) {
  if (!record) {
    return [];
  }

  return [{
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
  }];
}

export async function queryItemLocationRows({
  itemNo,
  provider,
  itemLocationMapping,
}) {
  const record = await getItemLocationByItemNo({
    itemNo,
    provider,
    itemLocationMapping,
  });

  return buildItemLocationRows(record);
}

function matchesFreeTextFilter(sourceValue, rawFilterValue) {
  const normalizedValues = String(rawFilterValue || '')
    .split(/[,，\s]+/)
    .filter((value) => value.trim() !== '')
    .map((value) => value.toLowerCase());

  if (normalizedValues.length === 0) {
    return true;
  }

  const currentValue = sourceValue ? String(sourceValue).toLowerCase() : '';
  return normalizedValues.some((value) => currentValue.includes(value));
}

function buildRecommendedInboundLocation(item) {
  const position = getRandomGridPosition();
  const tray = getRandomTrayId();
  return {
    ...item,
    tray,
    x: position.x,
    y: position.y,
    bin: formatBinId(tray, ((position.x - 1) * 2) + position.y),
    isRecommendedBin: true,
  };
}

export async function queryOpenTaskRows({
  filters = {},
  provider = 'mock',
  orders = {},
}) {
  if (provider === 'sap') {
    return queryOpenTasksFromSap(filters);
  }

  let matchedItems = [];

  Object.values(orders).forEach((toData) => {
    let matched = toData.status === 'pending';

    if (matched && filters.toNo) matched = matchesFreeTextFilter(toData.toNo, filters.toNo);
    if (matched && filters.workOrderNo) matched = matchesFreeTextFilter(toData.workOrderNo, filters.workOrderNo);
    if (matched && filters.deliveryNo) matched = matchesFreeTextFilter(toData.deliveryNo, filters.deliveryNo);
    if (matched && filters.jobType) matched = toData.jobType === filters.jobType;

    if (matched && Array.isArray(filters.date) && filters.date.length > 0) {
      const [dateValue] = filters.date;
      const normalizedDate = typeof dateValue?.format === 'function' ? dateValue.format('YYYY-MM-DD') : dateValue;
      matched = toData.createDate === normalizedDate;
    }

    if (!matched) {
      return;
    }

    const normalizedItems = (toData.items || []).map((item) => {
      const location = normalizeItemLocation(item);
      if (toData.jobType === 'inbound' && (!location.bin || !location.tray)) {
        return {
          ...buildRecommendedInboundLocation(item),
          jobType: toData.jobType,
          workOrderNo: toData.workOrderNo,
          deliveryNo: toData.deliveryNo,
          createDate: toData.createDate,
        };
      }

      return {
        ...item,
        ...location,
        isRecommendedBin: false,
        jobType: toData.jobType,
        workOrderNo: toData.workOrderNo,
        deliveryNo: toData.deliveryNo,
        createDate: toData.createDate,
      };
    });

    matchedItems = matchedItems.concat(normalizedItems);
  });

  return [...matchedItems].sort((left, right) => (
    left.toNo.localeCompare(right.toNo)
    || left.bin.localeCompare(right.bin)
    || left.itemNo.localeCompare(right.itemNo)
  ));
}
