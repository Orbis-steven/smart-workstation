import { findQueueJobForRow } from '../../modules/modula/queueService';

export function buildSapOrderColumns({
  t,
  locale,
  rows,
  selectedRows,
  isRowDisabled,
  handleSelectAll,
  handleSelectRow,
  ordersByToNo,
  jobQueue,
  lastQueryMode,
}) {
  const baseColumns = [
    {
      id: 'manual_selection',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '100%', paddingLeft: '8px' }}>
          <input
            type="checkbox"
            checked={rows.length > 0 && rows.filter((row) => !isRowDisabled(row)).length > 0 && selectedRows.length === rows.filter((row) => !isRowDisabled(row)).length}
            onChange={handleSelectAll}
            disabled={rows.length === 0 || rows.filter((row) => !isRowDisabled(row)).length === 0}
            className="w-4 h-4 text-indigo-600 rounded border-gray-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </span>
      ),
      colDef: { width: 40, minWidth: 40, maxWidth: 40, flex: 0, sortable: false, filterable: false, align: 'left', headerAlign: 'left', disableColumnMenu: true, disableReorder: true },
      render: (_, row) => {
        const disabled = isRowDisabled(row);
        return (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', height: '100%', paddingLeft: '8px' }}>
            <input
              type="checkbox"
              checked={selectedRows.some((selectedRow) => selectedRow.id === row.id)}
              onChange={(event) => handleSelectRow(row, event.target.checked)}
              disabled={disabled}
              className={`w-4 h-4 text-indigo-600 rounded border-gray-300 ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
            />
          </span>
        );
      },
    },
    { id: 'toNo', label: t('toNo'), colDef: { width: 120 } },
    {
      id: 'workOrderNo',
      label: t('workOrderNo'),
      colDef: { width: 130 },
      render: (_, row) => row.workOrderNo ? <span className="text-gray-700">{row.workOrderNo}</span> : <span className="text-gray-400">-</span>,
    },
    {
      id: 'deliveryNo',
      label: t('deliveryNo'),
      colDef: { width: 130 },
      render: (_, row) => row.deliveryNo ? <span className="text-gray-700">{row.deliveryNo}</span> : <span className="text-gray-400">-</span>,
    },
    {
      id: 'jobType',
      label: t('jobType'),
      colDef: { width: 100, align: 'center', headerAlign: 'center' },
      render: (_, row) => {
        const isLocationRow = row.isLocationQuery || row.jobType === 'location';
        const isInventoryRow = row.isInventoryQuery || row.jobType === 'inventory';
        const className = isLocationRow
          ? 'text-amber-600 font-medium'
          : isInventoryRow
            ? 'text-sky-600 font-medium'
            : row.jobType === 'inbound'
              ? 'text-green-600 font-medium'
              : 'text-indigo-600 font-medium';
        const label = isLocationRow
          ? (locale === 'zh' ? '库位' : locale === 'de' ? 'Lagerplatz' : 'Location')
          : isInventoryRow
            ? (locale === 'zh' ? '库存' : locale === 'de' ? 'Bestand' : 'Inventory')
            : row.jobType === 'inbound' ? t('inbound') : t('outbound');

        return <span className={className}>{label}</span>;
      },
    },
    {
      id: 'itemNo',
      label: t('itemNo'),
      colDef: { width: 300 },
      render: (_, row) => (
        <span title={row.itemNo} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%', maxWidth: '100%' }}>
          {row.itemNo}
        </span>
      ),
    },
    {
      id: 'description',
      label: t('desc'),
      colDef: { width: 300 },
      render: (_, row) => (
        <span title={row.description} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%', maxWidth: '100%' }}>
          {row.description}
        </span>
      ),
    },
    {
      id: 'tray',
      label: t('tray'),
      colDef: { width: 130 },
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <span>{row.tray}</span>
          {row.isRecommendedBin && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200 whitespace-nowrap">推荐</span>}
        </div>
      ),
    },
    {
      id: 'bin',
      label: t('bin'),
      colDef: { width: 140 },
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <span>{row.bin}</span>
          {row.isRecommendedBin && <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold border border-blue-200 whitespace-nowrap">推荐</span>}
        </div>
      ),
    },
    {
      id: 'coords',
      label: t('coords'),
      render: (_, row) => `(${row.x}, ${row.y})`,
      colDef: { width: 100 },
    },
    { id: 'createDate', label: t('date'), colDef: { width: 120 } },
    {
      id: 'qty',
      label: t('qty'),
      numeric: true,
      colDef: { width: 150, align: 'center', headerAlign: 'center' },
    },
    {
      id: 'status',
      label: t('status'),
      colDef: { width: 120 },
      render: (_, row) => {
        if (ordersByToNo[row.toNo]?.status === 'completed') {
          return <span className="text-green-600 font-medium">{t('completed')}</span>;
        }

        const activeOrPendingJob = findQueueJobForRow(row, jobQueue, ['pending', 'waiting', 'processing']);
        const completedJob = activeOrPendingJob ? null : findQueueJobForRow(row, jobQueue, ['completed']);
        const targetJob = activeOrPendingJob || completedJob;

        if (!targetJob) return <span className="text-gray-400">-</span>;
        if (targetJob.status === 'processing') return <span className="text-blue-600 font-medium">{t('processing')}</span>;
        if (targetJob.status === 'waiting') return <span className="text-yellow-600">{t('waiting')}</span>;
        if (targetJob.status === 'pending') return <span className="text-gray-500">{t('pending')}</span>;
        if (targetJob.status === 'completed') return <span className="text-green-600 font-medium">{t('completed')}</span>;
        return <span className="text-gray-400">-</span>;
      },
    },
  ];

  const columns = baseColumns.filter((column) => {
    if (lastQueryMode === 'trayInventory') {
      return !['manual_selection', 'toNo', 'workOrderNo', 'deliveryNo', 'status'].includes(column.id);
    }

    if (lastQueryMode === 'itemLocation') {
      return !['manual_selection', 'toNo', 'workOrderNo', 'deliveryNo', 'status', 'createDate'].includes(column.id);
    }

    return true;
  });

  const quantityColumnLabel = lastQueryMode === 'trayInventory'
    ? t('inventoryQty')
    : lastQueryMode === 'itemLocation'
      ? t('currentStock')
      : t('qty');

  return columns.map((column) => (
    column.id === 'qty'
      ? { ...column, label: quantityColumnLabel }
      : column
  ));
}
