export function JobConfirmContent({
  theme,
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
        <div>
          检测到在您本次需要操作的托盘中，<strong className="text-red-600">还有该 TO 的其他物料未被选中</strong>：
        </div>
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
                托盘 <strong className="text-indigo-500">{item.tray || item.bin}</strong> - 物料: {item.itemNo} <span className="opacity-70">(数量: {item.qty})</span>
              </span>
            </label>
          ))}
        </div>
        <div className={`mt-2 font-medium text-sm ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>
          建议：直接在上方勾选漏选项一同下发，以减少托盘的往复呼叫次数。
        </div>
      </div>
    );
  } else if (bins.length === 1) {
    suggestion = (
      <span>
        当前选中的 <strong className="text-indigo-600">{totalSelectedCount}</strong> 个物料全部位于同一个托盘 [<strong className="text-indigo-600">{bins[0]}</strong>] 中。
        <br />系统将只下发 <strong className="text-green-600">一次</strong> 托盘呼叫指令，即可完成所有物料的{verbName}。
      </span>
    );
  } else {
    suggestion = (
      <span>
        当前选中的物料分散在 <strong className="text-red-600">{bins.length}</strong> 个不同的托盘中 (<strong className="text-gray-700">{bins.join(', ')}</strong>)。
        <br />系统将 <strong className="text-indigo-600">依次</strong> 呼叫这些托盘，请按照设备提示顺序{verbName}。
      </span>
    );
  }

  return (
    <div className="text-sm text-gray-700 space-y-3">
      <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
        您选择了 <strong className="text-indigo-500 text-base">{totalSelectedCount}</strong> 个物料准备 <strong className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>{actionName}</strong>。
      </div>
      <div className={`border p-3 rounded-md ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-200') : (theme === 'dark' ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100')}`}>
        <div className={`font-bold mb-2 flex items-center gap-1 ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'text-amber-400' : 'text-amber-800') : (theme === 'dark' ? 'text-blue-400' : 'text-blue-800')}`}>
          <span role="img" aria-label="hint">{unselectedItemsInSameBins.length > 0 ? '⚠️' : '💡'}</span> 【智能建议】
        </div>
        <div className={`leading-relaxed ${unselectedItemsInSameBins.length > 0 ? (theme === 'dark' ? 'text-amber-200/80' : 'text-amber-900') : (theme === 'dark' ? 'text-blue-200/80' : 'text-blue-900')}`}>
          {suggestion}
        </div>
      </div>
      <div className={`text-xs pt-2 border-t ${theme === 'dark' ? 'text-gray-500 border-gray-700' : 'text-gray-500 border-gray-100'}`}>
        由于 Modula 每次最多处理 2 个请求，这些托盘将被加入处理队列，并实时显示进度。
      </div>
    </div>
  );
}
