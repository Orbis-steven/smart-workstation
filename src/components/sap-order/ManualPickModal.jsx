import { CheckCircle, Package, X } from 'lucide-react';
import { formatMessage } from '../../i18n/formatMessage';

export function ManualPickModal({
  isOpen,
  onClose,
  currentJob,
  pendingItems,
  onComplete,
  theme,
  dict,
  locale,
}) {
  if (!isOpen || !currentJob) {
    return null;
  }

  const t = (key, params = {}) => formatMessage(dict, locale, key, params);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}>
        <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                {t('manualPickTitle', { tray: currentJob.bin })}
              </h2>
              <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                {t('manualPickSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-3">
            {pendingItems.map((item, idx) => (
              <div key={item.id} className={`flex items-start gap-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200 shadow-sm'} transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-slate-100 text-slate-600'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className={`font-bold text-lg truncate ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
                        {item.itemNo}
                      </h3>
                      <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-black ${item.jobType === 'inbound' ? 'text-green-600 dark:text-green-500' : 'text-indigo-600 dark:text-indigo-500'}`}>
                        {item.qty} <span className="text-sm font-normal opacity-60">{t('pieces')}</span>
                      </div>
                      <div className={`text-xs font-medium uppercase mt-0.5 ${item.jobType === 'inbound' ? 'text-green-600/80 dark:text-green-500/80' : 'text-indigo-600/80 dark:text-indigo-500/80'}`}>
                        {item.jobType === 'inbound' ? t('inbound') : t('outbound')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed dark:border-gray-700">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 dark:text-gray-500 mb-0.5">{t('bin')}</span>
                      <span className={`font-mono text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'} flex items-center gap-2`}>
                        {item.bin}
                        {item.isRecommendedBin && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200 whitespace-nowrap">{t('recommendedBin')}</span>}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 dark:text-gray-500 mb-0.5">{t('coordinatePosition')}</span>
                      <span className={`font-mono text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>(X: {item.x}, Y: {item.y})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 border-t ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
          >
            <CheckCircle className="w-6 h-6" />
            {t('completeAndCallNextTray')}
          </button>
        </div>
      </div>
    </div>
  );
}
