import { updateTaskStatusInSap } from './sapGateway';
import { updateItemLocation } from './sapInventoryService';

export async function updateMaterialLocation(payload) {
  return updateItemLocation(payload);
}

export function updateMockTaskStatus({ orders = {}, toNo, status }) {
  if (!toNo || !orders[toNo]) {
    return orders;
  }

  return {
    ...orders,
    [toNo]: {
      ...orders[toNo],
      status,
    },
  };
}

export async function updateTaskStatus({ provider = 'mock', orders = {}, toNo, status }) {
  if (provider === 'sap') {
    return updateTaskStatusInSap({ toNo, status });
  }

  return updateMockTaskStatus({ orders, toNo, status });
}

export function finalizeCompletedToIfReady({ orders = {}, jobQueue = [], toNo }) {
  const currentOrder = orders[toNo];
  if (!currentOrder) {
    return orders;
  }

  const isFullyCompleted = currentOrder.items.every((item) => {
    const queueJob = jobQueue.find((job) => job.toNo === toNo && job.itemIds?.includes(item.id));
    return queueJob && queueJob.status === 'completed';
  });

  if (!isFullyCompleted) {
    return orders;
  }

  return updateMockTaskStatus({ orders, toNo, status: 'completed' });
}
