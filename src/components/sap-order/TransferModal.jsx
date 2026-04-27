export function TransferModal({
  open,
  theme,
  form,
  loading,
  onClose,
  onChange,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-800/70' : 'border-gray-100 bg-slate-50'}`}>
          <h2 className="text-xl font-bold">库位转移</h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>确认后当前系统会写入本地映射文件，后续接入 SAP 时这里会调用 SAP 接口同步。</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>物料号</label>
            <input
              value={form.itemNo}
              disabled
              className={`w-full border-2 rounded-xl px-4 py-3 text-base ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>转入 Tray</label>
              <input
                value={form.tray}
                onChange={(event) => onChange({ ...form, tray: event.target.value })}
                placeholder="1001"
                className={`w-full border-2 rounded-xl px-4 py-3 text-base focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>转入 Bin</label>
              <input
                value={form.bin}
                onChange={(event) => onChange({ ...form, bin: event.target.value })}
                placeholder="1001M01"
                className={`w-full border-2 rounded-xl px-4 py-3 text-base focus:ring-indigo-500 focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
        </div>
        <div className={`px-6 py-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-slate-50'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-bold border ${theme === 'dark' ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl font-bold text-white ${loading ? 'bg-gray-400 cursor-wait' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {loading ? '处理中...' : '确认转移'}
          </button>
        </div>
      </div>
    </div>
  );
}
