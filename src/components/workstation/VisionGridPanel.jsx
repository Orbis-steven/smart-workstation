import {
  getGridStyle,
  getInventoryBinLabel,
  getInventoryGridPosition,
  getTaskGridPosition,
  getTaskItemKey,
} from '../../modules/workstation/grid';

const CAMERA_ERROR_TEXT_KEYS = {
  permission_denied: 'overlay_permission_denied',
  not_found: 'overlay_not_found',
  in_use: 'overlay_in_use',
  constraint_failed: 'overlay_constraint_failed',
  unsupported: 'overlay_unsupported',
};

export function VisionGridPanel({
  title,
  videoRef,
  cameraStatus,
  cameraErrorCode,
  state,
  visionReady,
  inventory,
  mode,
  displayPendingItems,
  inboundTargetItem,
  outboundTargetKey,
  canShowGridHighlights,
  t,
}) {
  const gridCellWidth = 100 / 17;
  const gridCellHeight = 100 / 2;
  const hasCameraError = cameraStatus === 'error';
  const isRequestingCamera = cameraStatus === 'requesting';
  const cameraErrorTextKey = CAMERA_ERROR_TEXT_KEYS[cameraErrorCode] || 'overlay_error';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      <div className="relative w-full max-w-2xl mx-auto border-4 border-gray-800 rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${hasCameraError ? 'hidden' : 'block'}`}
        />

        {isRequestingCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-20 bg-gray-100/80 p-8 text-center backdrop-blur-sm">
            <p className="text-lg font-medium">{t('overlay_requesting')}</p>
          </div>
        )}

        {state === 'IDLE' && !visionReady && !hasCameraError && !isRequestingCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-20 bg-gray-100/80 p-8 text-center backdrop-blur-sm">
            <p className="text-lg font-medium">{t('overlay_idle')}</p>
          </div>
        )}

        {hasCameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 z-20 bg-red-50 p-8 text-center backdrop-blur-sm">
            <p className="text-lg font-medium">{t(cameraErrorTextKey)}</p>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none z-10" style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: `${gridCellWidth}% ${gridCellHeight}%`,
        }}>
          {inventory.map((item) => {
            const gridPosition = getInventoryGridPosition(item);
            if (!gridPosition) return null;

            const isTarget = mode === 'OUTBOUND' && displayPendingItems.some((pendingItem) => pendingItem.itemNo === item.item_id && getTaskItemKey(pendingItem) === outboundTargetKey);
            const binLabel = getInventoryBinLabel(item, gridPosition);

            return (
              <div
                key={item.id}
                className={`absolute border-2 rounded-sm shadow-md flex flex-col items-center justify-center text-white text-xs font-bold transition-all ${isTarget ? 'bg-yellow-500/60 border-yellow-400 animate-pulse z-20' : 'bg-blue-500/80 border-blue-700 z-10'}`}
                style={getGridStyle(gridPosition)}
                title={`${item.item_id} at (${gridPosition.gridX + 1}, ${gridPosition.gridY + 1}) - ${binLabel}`}
              >
                <span className="text-lg">{isTarget ? '🎯' : '📦'}</span>
                <span className="text-[10px] mt-1 bg-black/50 px-1 rounded">{binLabel}</span>
                {isTarget && <span className="text-[10px] text-yellow-100 mt-0.5">{t('pick_here')}</span>}
              </div>
            );
          })}

          {mode === 'OUTBOUND' && canShowGridHighlights && displayPendingItems.map((item) => {
            const gridPosition = getTaskGridPosition(item);
            if (!gridPosition) return null;
            const isTarget = getTaskItemKey(item) === outboundTargetKey;

            return (
              <div
                key={`pending-${getTaskItemKey(item)}`}
                className={`absolute border-2 rounded-sm shadow-md flex flex-col items-center justify-center text-white text-xs font-bold transition-all ${isTarget ? 'bg-yellow-500/60 border-yellow-400 animate-pulse z-30' : 'bg-blue-500/80 border-blue-700 z-20'}`}
                style={getGridStyle(gridPosition)}
                title={`${item.itemNo} at (${item.x}, ${item.y}) - ${item.bin}`}
              >
                <span className="text-lg">{isTarget ? '🎯' : '📦'}</span>
                <span className="text-[10px] mt-1 bg-black/50 px-1 rounded">{item.bin}</span>
                {isTarget && <span className="text-[10px] text-yellow-100 mt-0.5">{t('pick_here')}</span>}
              </div>
            );
          })}

          {mode === 'INBOUND' && canShowGridHighlights && inboundTargetItem && (() => {
            const gridPosition = getTaskGridPosition(inboundTargetItem);
            if (!gridPosition) return null;

            return (
              <div
                className="absolute border-2 border-dashed border-green-400 bg-green-500/20 rounded-sm flex flex-col items-center justify-center text-white text-xs font-bold animate-pulse z-30"
                style={getGridStyle(gridPosition)}
                title={`${inboundTargetItem.itemNo} at (${inboundTargetItem.x}, ${inboundTargetItem.y}) - ${inboundTargetItem.bin}`}
              >
                <span className="text-lg opacity-80">📥</span>
                <span className="text-[10px] mt-1 bg-black/50 px-1 rounded">{inboundTargetItem.bin}</span>
                <span className="text-[10px] text-green-200 mt-0.5">{t('target_bin_hint')}</span>
              </div>
            );
          })()}
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
          <span>{t('legend_target_inbound')}</span>
        </div>
      </div>
    </div>
  );
}
