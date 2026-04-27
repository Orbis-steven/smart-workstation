import {
  formatBinId,
  getBinNumberFromGrid,
  MODULA_GRID_COLUMNS,
  MODULA_GRID_ROWS,
  normalizeTrayId,
} from '../modula/trayNaming';

export function getGridPosition(xValue, yValue, oneBased = true) {
  const x = Number(xValue);
  const y = Number(yValue);
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;

  const gridX = oneBased ? x - 1 : x;
  const gridY = oneBased ? y - 1 : y;
  if (gridX < 0 || gridX >= MODULA_GRID_COLUMNS || gridY < 0 || gridY >= MODULA_GRID_ROWS) return null;

  return { gridX, gridY };
}

export function getTaskGridPosition(item) {
  return getGridPosition(item?.x, item?.y, true);
}

export function getInventoryGridPosition(item) {
  return getGridPosition(item?.grid_x, item?.grid_y, false) || getGridPosition(item?.grid_x, item?.grid_y, true);
}

export function getGridStyle(position) {
  return {
    left: `${position.gridX * (100 / MODULA_GRID_COLUMNS)}%`,
    top: `${position.gridY * (100 / MODULA_GRID_ROWS)}%`,
    width: `${100 / MODULA_GRID_COLUMNS}%`,
    height: `${100 / MODULA_GRID_ROWS}%`,
  };
}

export function getTaskItemKey(item) {
  return item ? (item.id ?? item.itemNo ?? `${item.bin}-${item.x}-${item.y}`) : '';
}

export function getInventoryBinLabel(item, position) {
  const normalizedTrayId = normalizeTrayId(item.tray_id);
  const binNum = getBinNumberFromGrid(position.gridX, position.gridY);
  return formatBinId(normalizedTrayId, binNum);
}
