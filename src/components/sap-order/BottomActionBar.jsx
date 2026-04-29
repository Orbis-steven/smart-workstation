export function BottomActionBar({
  theme,
  t,
  rows,
  selectedRows,
  isRowDisabled,
  inboundSelectedCount,
  outboundSelectedCount,
  hasLocationQueryRow,
  onToggleSelectAll,
  onOpenTransfer,
  onInbound,
  onOutbound,
}) {
  const selectableRows = rows.filter((row) => !isRowDisabled(row));
  const allSelected = selectableRows.length > 0 && selectedRows.length === selectableRows.length;

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-50 transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSelectAll}
          disabled={rows.length === 0 || selectableRows.length === 0}
          className={`px-6 py-3 rounded-xl text-lg font-bold border-2 transition-all active:scale-95 ${
            rows.length === 0 || selectableRows.length === 0
              ? (theme === 'dark' ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-gray-200 text-gray-400 cursor-not-allowed')
              : (allSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'border-gray-300 text-gray-700 hover:bg-gray-50')
          }`}
        >
          {allSelected ? t('deselectAll') : t('selectAll')}
        </button>
        <div className={`text-base font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {t('selectedSummary', { inboundCount: inboundSelectedCount, outboundCount: outboundSelectedCount })}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onOpenTransfer}
          disabled={!hasLocationQueryRow}
          className={`px-8 py-4 rounded-xl text-lg font-bold shadow-md transition-all active:scale-95 ${
            !hasLocationQueryRow
              ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {t('transferAction')}
        </button>
        <button
          onClick={onInbound}
          disabled={inboundSelectedCount === 0}
          className={`px-8 py-4 rounded-xl text-lg font-bold shadow-md transition-all active:scale-95 ${
            inboundSelectedCount === 0
              ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {t('inboundBtn', { count: inboundSelectedCount })}
        </button>
        <button
          onClick={onOutbound}
          disabled={outboundSelectedCount === 0}
          className={`px-8 py-4 rounded-xl text-lg font-bold shadow-md transition-all active:scale-95 ${
            outboundSelectedCount === 0
              ? (theme === 'dark' ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {t('outboundBtn', { count: outboundSelectedCount })}
        </button>
      </div>
    </div>
  );
}
