export function SearchFilters({
  theme,
  t,
  filterValues,
  trayInventoryInput,
  onFilterValuesChange,
  onTrayInventoryInputChange,
  onSearch,
}) {
  return (
    <div className={`flex flex-wrap items-end gap-6 p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-sm mb-4 transition-colors`}>
      <div className="flex flex-wrap items-end gap-6 flex-1">
        <div className="w-[180px]">
          <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('jobType')}</label>
          <select
            value={filterValues.jobType || ''}
            onChange={(event) => onFilterValuesChange({ ...filterValues, jobType: event.target.value })}
            className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
          >
            <option value="">{t('all')}</option>
            <option value="inbound">{t('inbound')}</option>
            <option value="outbound">{t('outbound')}</option>
          </select>
        </div>

        <div className="w-[200px]">
          <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('toNo')}</label>
          <input
            type="text"
            value={filterValues.toNo || ''}
            onChange={(event) => onFilterValuesChange({ ...filterValues, toNo: event.target.value })}
            onKeyDown={(event) => event.key === 'Enter' && onSearch(filterValues)}
            className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder={t('toPlaceholder')}
          />
        </div>

        <div className="w-[220px]">
          <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('materialNoLabel')}</label>
          <input
            type="text"
            value={filterValues.itemNo || ''}
            onChange={(event) => onFilterValuesChange({ ...filterValues, itemNo: event.target.value })}
            onKeyDown={(event) => event.key === 'Enter' && onSearch(filterValues)}
            className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder={t('itemPlaceholder')}
          />
        </div>

        <div className="w-[220px]">
          <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('trayInventory')}</label>
          <input
            type="text"
            value={trayInventoryInput}
            onChange={(event) => {
              onTrayInventoryInputChange(event.target.value);
              onFilterValuesChange({ ...filterValues, trayInventory: event.target.value });
            }}
            onKeyDown={(event) => event.key === 'Enter' && onSearch({ ...filterValues, trayInventory: trayInventoryInput || event.currentTarget.value })}
            className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder={t('trayInventoryPlaceholder')}
          />
        </div>

        {filterValues.jobType !== 'inbound' && (
          <>
            <div className="w-[200px]">
              <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('workOrderNo')}</label>
              <input
                type="text"
                value={filterValues.workOrderNo || ''}
                onChange={(event) => onFilterValuesChange({ ...filterValues, workOrderNo: event.target.value })}
                onKeyDown={(event) => event.key === 'Enter' && onSearch(filterValues)}
                className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder={t('workOrderPlaceholder')}
              />
            </div>

            <div className="w-[200px]">
              <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('deliveryNo')}</label>
              <input
                type="text"
                value={filterValues.deliveryNo || ''}
                onChange={(event) => onFilterValuesChange({ ...filterValues, deliveryNo: event.target.value })}
                onKeyDown={(event) => event.key === 'Enter' && onSearch(filterValues)}
                className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder={t('deliveryPlaceholder')}
              />
            </div>
          </>
        )}

        <div className="w-[200px]">
          <label className={`block text-base font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{t('date')}</label>
          <input
            type="date"
            value={filterValues.date ? filterValues.date[0] : ''}
            onChange={(event) => onFilterValuesChange({ ...filterValues, date: event.target.value ? [event.target.value] : [] })}
            className={`w-full border-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300'} rounded-xl px-4 py-3 text-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500`}
          />
        </div>
      </div>

      <div className="shrink-0">
        <button
          onClick={() => onSearch(filterValues)}
          className="px-8 py-3 text-lg bg-[#0A6ED1] text-white font-bold rounded-xl shadow-md hover:bg-[#0854A0] transition-colors h-[54px] border border-transparent active:scale-95"
        >
          {t('go')}
        </button>
      </div>
    </div>
  );
}
