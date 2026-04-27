export const MODULA_MACHINE_NO = 1;
export const MODULA_LEVEL_COUNT = 90;
export const MODULA_GRID_COLUMNS = 17;
export const MODULA_GRID_ROWS = 2;
export const MODULA_BINS_PER_TRAY = MODULA_GRID_COLUMNS * MODULA_GRID_ROWS;

const LEGACY_TRAY_PATTERN = /^TRAY-(\d{1,3})$/i;
const LEGACY_BIN_PATTERN = /^(?:TRAY-(\d{1,3})|(\d{4}))M(\d{1,2})$/i;

export function formatTrayId(level, machineNo = MODULA_MACHINE_NO) {
  const numericLevel = Number(level);
  if (!Number.isInteger(numericLevel) || numericLevel < 1 || numericLevel > MODULA_LEVEL_COUNT) {
    return '';
  }

  return `${machineNo}${numericLevel.toString().padStart(3, '0')}`;
}

export function normalizeTrayId(trayId, machineNo = MODULA_MACHINE_NO) {
  if (trayId == null) {
    return trayId;
  }

  const value = String(trayId).trim();
  if (!value) {
    return value;
  }

  const legacyMatch = value.match(LEGACY_TRAY_PATTERN);
  if (legacyMatch) {
    return formatTrayId(Number(legacyMatch[1]), machineNo) || value;
  }

  if (/^\d+$/.test(value)) {
    const machinePrefix = String(machineNo);
    if (value.startsWith(machinePrefix) && value.length === machinePrefix.length + 3) {
      const level = Number(value.slice(machinePrefix.length));
      return formatTrayId(level, machineNo) || value;
    }

    const numericLevel = Number(value);
    return formatTrayId(numericLevel, machineNo) || value;
  }

  return value;
}

export function formatBinId(trayId, binNumber, machineNo = MODULA_MACHINE_NO) {
  const normalizedTrayId = normalizeTrayId(trayId, machineNo);
  const numericBinNumber = Number(binNumber);
  if (!normalizedTrayId || !Number.isInteger(numericBinNumber) || numericBinNumber < 1 || numericBinNumber > MODULA_BINS_PER_TRAY) {
    return '';
  }

  return `${normalizedTrayId}M${numericBinNumber.toString().padStart(2, '0')}`;
}

export function normalizeBinId(binId, trayId = null, machineNo = MODULA_MACHINE_NO) {
  if (binId == null) {
    return binId;
  }

  const value = String(binId).trim();
  if (!value) {
    return value;
  }

  const match = value.match(LEGACY_BIN_PATTERN);
  if (match) {
    const trayPart = match[1] ? formatTrayId(Number(match[1]), machineNo) : normalizeTrayId(match[2], machineNo);
    const binNumber = Number(match[3]);
    return formatBinId(trayPart, binNumber, machineNo) || value;
  }

  if (/^\d+$/.test(value) && trayId != null) {
    return formatBinId(trayId, Number(value), machineNo) || value;
  }

  return value;
}

export function getBinNumberFromGrid(gridX, gridY) {
  return (Number(gridX) * MODULA_GRID_ROWS) + Number(gridY) + 1;
}

export function getBinNumberFromPosition(x, y) {
  return ((Number(x) - 1) * MODULA_GRID_ROWS) + Number(y);
}

export function getGridPositionFromBin(binId, trayId = null, machineNo = MODULA_MACHINE_NO) {
  const normalizedBinId = normalizeBinId(binId, trayId, machineNo);
  if (!normalizedBinId) {
    return { x: null, y: null, binNumber: null };
  }

  const match = String(normalizedBinId).match(/M(\d{1,2})$/i);
  if (!match) {
    return { x: null, y: null, binNumber: null };
  }

  const binNumber = Number(match[1]);
  if (!Number.isInteger(binNumber) || binNumber < 1 || binNumber > MODULA_BINS_PER_TRAY) {
    return { x: null, y: null, binNumber: null };
  }

  return {
    x: Math.ceil(binNumber / MODULA_GRID_ROWS),
    y: ((binNumber - 1) % MODULA_GRID_ROWS) + 1,
    binNumber,
  };
}

export function getRandomTrayId(machineNo = MODULA_MACHINE_NO) {
  const level = Math.floor(Math.random() * MODULA_LEVEL_COUNT) + 1;
  return formatTrayId(level, machineNo);
}

export function getRandomGridPosition() {
  return {
    x: Math.floor(Math.random() * MODULA_GRID_COLUMNS) + 1,
    y: Math.floor(Math.random() * MODULA_GRID_ROWS) + 1,
  };
}

export function normalizeItemLocation(item, machineNo = MODULA_MACHINE_NO) {
  if (!item) {
    return item;
  }

  const tray = normalizeTrayId(item.tray, machineNo);
  const bin = normalizeBinId(item.bin, tray ?? item.tray, machineNo);

  return {
    ...item,
    tray,
    bin,
  };
}
