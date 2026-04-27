import { normalizeItemLocation } from '../../modula/trayNaming';

const rawData = {
  'TO-1001': {
    toNo: 'TO-1001',
    workOrderNo: 'WO-20010',
    deliveryNo: null,
    jobType: 'outbound',
    createDate: '2026-04-13',
    status: 'pending',
    items: [
      { id: '1', toNo: 'TO-1001', itemNo: '7733-2009-113-P01', description: 'M8 Screw', tray: 'TRAY-01', bin: 'TRAY-01M01', x: 1, y: 1, qty: 50 },
      { id: '2', toNo: 'TO-1001', itemNo: '7733-2009-113-P02', description: 'M10 Screw', tray: 'TRAY-01', bin: 'TRAY-01M02', x: 1, y: 2, qty: 30 },
      { id: '3', toNo: 'TO-1001', itemNo: '7733-2009-114-B05', description: 'Hex Bolt', tray: 'TRAY-02', bin: 'TRAY-02M33', x: 17, y: 1, qty: 100 },
    ],
  },
  'TO-1002': {
    toNo: 'TO-1002',
    jobType: 'inbound',
    createDate: '2026-04-13',
    status: 'pending',
    items: [
      { id: '4', toNo: 'TO-1002', itemNo: '8844-3010-225-M01', description: 'Stepper Motor', tray: 'TRAY-03', bin: 'TRAY-03M03', x: 2, y: 1, qty: 2 },
      { id: '5', toNo: 'TO-1002', itemNo: '8844-3010-225-C02', description: 'Power Cable', tray: 'TRAY-03', bin: 'TRAY-03M04', x: 2, y: 2, qty: 5 },
      { id: '6', toNo: 'TO-1002', itemNo: '8844-3010-226-S09', description: 'Proximity Sensor', tray: 'TRAY-03', bin: 'TRAY-03M34', x: 17, y: 2, qty: 1 },
      { id: '7', toNo: 'TO-1002', itemNo: '7733-2009-113-P01', description: 'M8 Screw', tray: 'TRAY-01', bin: 'TRAY-01M05', x: 3, y: 1, qty: 20 },
    ],
  },
  'TO-1003': {
    toNo: 'TO-1003',
    workOrderNo: 'WO-20010',
    deliveryNo: null,
    jobType: 'outbound',
    createDate: '2026-04-13',
    status: 'pending',
    items: [
      { id: '8', toNo: 'TO-1003', itemNo: '9955-4011-336-R01', description: 'Roller Bearing', tray: 'TRAY-04', bin: 'TRAY-04M15', x: 8, y: 1, qty: 10 },
      { id: '9', toNo: 'TO-1003', itemNo: '9955-4011-336-W02', description: 'Steel Washer', tray: 'TRAY-04', bin: 'TRAY-04M16', x: 8, y: 2, qty: 200 },
      { id: '10', toNo: 'TO-1003', itemNo: '7733-2009-114-B05', description: 'Hex Bolt', tray: 'TRAY-02', bin: 'TRAY-02M33', x: 17, y: 1, qty: 50 },
    ],
  },
  'TO-1004': {
    toNo: 'TO-1004',
    jobType: 'inbound',
    createDate: '2026-04-14',
    status: 'pending',
    items: [
      { id: '11', toNo: 'TO-1004', itemNo: '1122-3344-556-A01', description: 'LED Indicator', tray: 'TRAY-05', bin: 'TRAY-05M21', x: 11, y: 1, qty: 100 },
      { id: '12', toNo: 'TO-1004', itemNo: '1122-3344-556-A02', description: 'Switch Button', tray: 'TRAY-05', bin: 'TRAY-05M22', x: 11, y: 2, qty: 50 },
    ],
  },
  'TO-1005': {
    toNo: 'TO-1005',
    workOrderNo: 'WO-20011',
    deliveryNo: null,
    jobType: 'outbound',
    createDate: '2026-04-14',
    status: 'pending',
    items: [
      { id: '13', toNo: 'TO-1005', itemNo: '8844-3010-225-M01', description: 'Stepper Motor', tray: 'TRAY-03', bin: 'TRAY-03M03', x: 2, y: 1, qty: 1 },
    ],
  },
  'TO-1006': {
    toNo: 'TO-1006',
    jobType: 'inbound',
    createDate: '2026-04-15',
    status: 'pending',
    items: [
      { id: '14', toNo: 'TO-1006', itemNo: '5566-7788-990-C01', description: 'Copper Wire 2mm', tray: 'TRAY-06', bin: 'TRAY-06M07', x: 4, y: 1, qty: 500 },
      { id: '15', toNo: 'TO-1006', itemNo: '5566-7788-990-C02', description: 'Copper Wire 4mm', tray: 'TRAY-06', bin: 'TRAY-06M08', x: 4, y: 2, qty: 300 },
      { id: '16', toNo: 'TO-1006', itemNo: '5566-7788-990-C03', description: 'Insulation Tape', tray: 'TRAY-01', bin: 'TRAY-01M06', x: 3, y: 2, qty: 50 },
    ],
  },
  'TO-1007': {
    toNo: 'TO-1007',
    workOrderNo: null,
    deliveryNo: 'DO-30012',
    jobType: 'outbound',
    createDate: '2026-04-15',
    status: 'pending',
    items: [
      { id: '17', toNo: 'TO-1007', itemNo: '7733-2009-114-B05', description: 'Hex Bolt', tray: 'TRAY-02', bin: 'TRAY-02M33', x: 17, y: 1, qty: 20 },
      { id: '18', toNo: 'TO-1007', itemNo: '9955-4011-336-W02', description: 'Steel Washer', tray: 'TRAY-04', bin: 'TRAY-04M16', x: 8, y: 2, qty: 40 },
    ],
  },
  'TO-1008': {
    toNo: 'TO-1008',
    jobType: 'inbound',
    createDate: '2026-04-16',
    status: 'pending',
    items: [
      { id: '19', toNo: 'TO-1008', itemNo: '3344-5566-778-P01', description: 'Plastic Enclosure', tray: 'TRAY-07', bin: 'TRAY-07M29', x: 15, y: 1, qty: 10 },
    ],
  },
  'TO-1009': {
    toNo: 'TO-1009',
    workOrderNo: 'WO-20012',
    deliveryNo: null,
    jobType: 'outbound',
    createDate: '2026-04-16',
    status: 'pending',
    items: [
      { id: '20', toNo: 'TO-1009', itemNo: '8844-3010-226-S09', description: 'Proximity Sensor', tray: 'TRAY-03', bin: 'TRAY-03M34', x: 17, y: 2, qty: 1 },
      { id: '21', toNo: 'TO-1009', itemNo: '1122-3344-556-A01', description: 'LED Indicator', tray: 'TRAY-05', bin: 'TRAY-05M21', x: 11, y: 1, qty: 5 },
    ],
  },
  'TO-1010': {
    toNo: 'TO-1010',
    jobType: 'inbound',
    createDate: '2026-04-17',
    status: 'pending',
    items: [
      { id: '22', toNo: 'TO-1010', itemNo: '2233-4455-667-M01', description: 'Microcontroller', tray: 'TRAY-08', bin: 'TRAY-08M11', x: 6, y: 1, qty: 50 },
      { id: '23', toNo: 'TO-1010', itemNo: '2233-4455-667-M02', description: 'WiFi Module', tray: 'TRAY-08', bin: 'TRAY-08M12', x: 6, y: 2, qty: 50 },
    ],
  },
  'TO-1011': {
    toNo: 'TO-1011',
    workOrderNo: null,
    deliveryNo: 'DO-30014',
    jobType: 'outbound',
    createDate: '2026-04-17',
    status: 'pending',
    items: [
      { id: '24', toNo: 'TO-1011', itemNo: '5566-7788-990-C01', description: 'Copper Wire 2mm', tray: 'TRAY-06', bin: 'TRAY-06M07', x: 4, y: 1, qty: 100 },
    ],
  },
  'TO-1012': {
    toNo: 'TO-1012',
    jobType: 'inbound',
    createDate: '2026-04-18',
    status: 'pending',
    items: [
      { id: '25', toNo: 'TO-1012', itemNo: '9900-1122-334-F01', description: 'Cooling Fan', tray: 'TRAY-09', bin: 'TRAY-09M31', x: 16, y: 1, qty: 20 },
      { id: '26', toNo: 'TO-1012', itemNo: '9900-1122-334-H01', description: 'Heat Sink', tray: 'TRAY-09', bin: 'TRAY-09M32', x: 16, y: 2, qty: 20 },
    ],
  },
  'TO-1013': {
    toNo: 'TO-1013',
    workOrderNo: 'WO-20014',
    deliveryNo: null,
    jobType: 'outbound',
    createDate: '2026-04-18',
    status: 'pending',
    items: [
      { id: '27', toNo: 'TO-1013', itemNo: '2233-4455-667-M01', description: 'Microcontroller', tray: 'TRAY-08', bin: 'TRAY-08M11', x: 6, y: 1, qty: 10 },
      { id: '28', toNo: 'TO-1013', itemNo: '7733-2009-113-P01', description: 'M8 Screw', tray: 'TRAY-01', bin: 'TRAY-01M01', x: 1, y: 1, qty: 100 },
      { id: '29', toNo: 'TO-1013', itemNo: '3344-5566-778-P01', description: 'Plastic Enclosure', tray: 'TRAY-07', bin: 'TRAY-07M29', x: 15, y: 1, qty: 2 },
    ],
  },
  'TO-1014': {
    toNo: 'TO-1014',
    workOrderNo: null,
    deliveryNo: null,
    jobType: 'inbound',
    createDate: '2026-04-18',
    status: 'pending',
    items: [
      { id: '30', toNo: 'TO-1014', itemNo: 'NEW-PART-001', description: 'New Component A (无预设库位)', tray: null, bin: null, x: null, y: null, qty: 150 },
      { id: '31', toNo: 'TO-1014', itemNo: 'NEW-PART-002', description: 'New Component B (无预设库位)', tray: null, bin: null, x: null, y: null, qty: 80 },
    ],
  },
};

const normalizedRawData = Object.fromEntries(
  Object.entries(rawData).map(([toNo, toData]) => [
    toNo,
    {
      ...toData,
      items: toData.items.map((item) => normalizeItemLocation(item)),
    },
  ]),
);

export const mockSapOrdersJson = JSON.stringify(normalizedRawData);
