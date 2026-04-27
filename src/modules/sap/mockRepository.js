import { mockItemLocationMapping } from './mock/itemLocationMapping';
import { mockSapOrdersJson } from './mock/sapOrders';
import { mockTrayInventorySnapshot } from './mock/trayInventorySnapshot';

export function createInitialMockSapOrders() {
  return JSON.parse(mockSapOrdersJson);
}

export function createInitialItemLocationMapping() {
  return JSON.parse(JSON.stringify(mockItemLocationMapping));
}

export function createInitialTrayInventorySnapshot() {
  return JSON.parse(JSON.stringify(mockTrayInventorySnapshot));
}
