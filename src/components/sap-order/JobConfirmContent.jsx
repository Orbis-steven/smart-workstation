export function JobConfirmContent({
  theme,
  t,
  actionName,
  verbName,
  bins,
  relevantRows,
  unselectedItemsInSameBins,
  extraSelectedIds,
  setExtraSelectedIds,
}) {
  const totalSelectedCount = relevantRows.length + extraSelectedIds.length;

  let suggestion = null;
  if (unselectedItemsInSameBins.length > 0) {
    suggestion = (
      <div className="space-y-2">
        <div>{t('jobConfirmDetectedExtras')}</div>
        <div className={`border rounded-md p-2 max-h-40 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-amber-200'}`}>
          {unselectedItemsInSameBins.map((item) => (
            <label key={item.id} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-amber-50'}`}>
              <input
                type="checkbox"
                checked={extraSelectedIds.includes(item.id)}
                onChange={(event) => {
                  if (event.target.checked) {
                    setExtraSelectedIds((prev) => [...prev, item.id]);
                  } else {
                    setExtraSelectedIds((prev) => prev.filter((id) => id !== item.id));
                  }
                }}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300"
              />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                {t('jobConfirmTrayItemQty', { tray: item.tray || item.bin, itemNo: item.itemNo, qty: item.qty })}
              </span>
            </label>
          ))}
        </div>
        <div className={`mt-2 font-medium text-sm ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>
          {t('jobConfirmSuggestion')}
        </div>
      </div>
    );
  } else if (bins.length === 1) {
    suggestion = t('jobConfirmSingleTray', {
      count: totalSelectedCount,
      tray: bins[0],
      verb: verbName,
    });
  } else {
    suggestion = t('jobConfirmMultipleTrays', {
      count: bins.length,
      trays: bins.join(', '),
      verb: verbName,
    });
  }

  return (
    <div className="text-sm text-gray-700 space-y-3">
      <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
        {t('jobConfirmSelectedCount', { count: totalSelectedCount, action: actionName })}
      </div>
      <div className={`border p-3 rounded-md ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200') : (theme === 'dark' ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100')}`}>
        <div className={`font-bold mb-2 flex items-center gap-1 ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-800') : (theme === 'dark' ? 'text-blue-400' : 'text-blue-800')}`}>
          {t('jobConfirmSmartAdvice')}
        </div>
        <div className={`leading-relaxed ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'text-amber-200/80' : 'text-amber-900') : (theme === 'dark' ? 'text-blue-200/80' : 'text-blue-900')}`}>
          {suggestion}
        </div>
      </div>
      <div className={`text-xs pt-2 border-t ${theme === 'dark' ? 'text-gray-500 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
        {t('jobConfirmQueueHint')}
      </div>
    </div>
  );
}
