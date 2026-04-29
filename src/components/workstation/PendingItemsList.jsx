export function PendingItemsList({ pendingItems, selectedItemNo, t }) {
  if (!pendingItems?.length) {
    return null;
  }

  return (
    <div className="pl-4 mt-4">
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center justify-between">
          {t('pending_items')}
          <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{pendingItems.length}</span>
        </h4>
        <ul className="text-sm space-y-1 max-h-32 overflow-y-auto pr-1">
          {pendingItems.map((item) => {
            const isCurrent = item.itemNo === selectedItemNo;
            return (
              <li key={item.id} className={`flex justify-between items-center px-2 py-1 rounded ${isCurrent ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className="truncate pr-2" title={item.itemNo}>{item.itemNo}</span>
                <span className="text-xs shrink-0 bg-white/50 px-1.5 py-0.5 rounded text-gray-500">x{item.qty}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
