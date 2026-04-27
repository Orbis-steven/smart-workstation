export function InventoryTable({ title, inventory, t }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="pb-2 font-medium">{t('th_id')}</th>
              <th className="pb-2 font-medium">{t('th_item')}</th>
              <th className="pb-2 font-medium">{t('th_tray')}</th>
              <th className="pb-2 font-medium">{t('th_grid')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-2 text-gray-500">#{item.id}</td>
                <td className="py-2 font-medium text-gray-800">{item.item_id}</td>
                <td className="py-2 text-gray-600">{item.tray_id}</td>
                <td className="py-2">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                    ({item.grid_x}, {item.grid_y})
                  </span>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400">{t('no_data')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
