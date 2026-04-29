import { Camera } from 'lucide-react';

export function QueuePanel({
  theme,
  t,
  jobQueue,
  summary,
  visionMode,
  hasActiveVisualJobs,
  onRestoreVision,
  onClearQueue,
}) {
  if (!jobQueue.length) {
    return null;
  }

  return (
    <div className={`p-4 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-slate-50 border-slate-200'} border rounded-md transition-colors relative`}>
      <button
        onClick={onClearQueue}
        className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full ${theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-700'} transition-colors text-xs font-bold`}
        title={t('closeAndClearQueue')}
      >
        x
      </button>

      <div className="flex justify-between items-center mb-3 pr-8">
        <div className="flex items-center gap-4">
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>{t('queueTitle')}</h3>
          {visionMode && hasActiveVisualJobs && (
            <button
              onClick={onRestoreVision}
              className="px-3 py-1 text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 rounded-md shadow-sm transition-colors flex items-center gap-1 animate-pulse"
            >
              <Camera className="w-3.5 h-3.5" />
              {t('restoreVision')}
            </button>
          )}
        </div>

        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
          {t('processingCount')}: {summary.processing} | {t('waitingCount')}: {summary.waiting} | {t('pendingCount')}: {summary.pending} | {t('completedCount')}: {summary.completed}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {jobQueue.map((job) => {
          let bgClass = theme === 'dark' ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200';
          let icon = '...';
          let statusText = t('pending');

          if (job.status === 'processing') {
            bgClass = theme === 'dark' ? 'bg-blue-900 text-blue-300 border-blue-800 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
            icon = '>>';
            statusText = t('processing');
          } else if (job.status === 'waiting') {
            bgClass = theme === 'dark' ? 'bg-yellow-900 text-yellow-300 border-yellow-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
            icon = '||';
            statusText = t('waiting');
          } else if (job.status === 'completed') {
            bgClass = theme === 'dark' ? 'bg-green-900 text-green-300 border-green-800 opacity-50' : 'bg-green-50 text-green-700 border-green-200 opacity-50';
            icon = 'OK';
            statusText = t('completed');
          }

          return (
            <div key={job.id} className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm ${bgClass} transition-all duration-500`}>
              <span className="text-base">{icon}</span>
              <div className="flex flex-col">
                <span className="font-medium">{t('tray')}: {job.bin}</span>
                <span className="text-[10px] uppercase opacity-80">
                  {job.type === 'inbound' ? t('inbound') : t('outbound')} | {job.itemsCount} {t('itemsCount')} | {statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
