# Pad Patterns

## 1. Layout-first（推荐）

适用：完整平板壳层页面。

- 外层：`PAppPageLayout`
- 顶部 workload：`PWorkloadNav`
- 主体：`PTable + PSmartFilter`
- 侧栏/底部输入：`PNumericKeypad`
- 状态管理：`usePadLayout + usePadRecordEditor`

## 2. Touch Report（报表为主）

适用：需要保留 CTable 能力但改成触摸卡片行。

- 使用 `PTable` 替代 `CTable`
- 保留 `filterConfig`, `quickCreate`, `quickEdit`, `quickDelete`
- `cardTitleField / cardSubtitleFields / cardActionSlot` 控制触摸卡片密度与重点字段

## 3. Touch Card Workflow（卡片流转）

适用：滑动动作、就地处理任务。

- 使用 `PTouchCard`
- 左/右动作分别绑定 `startAction` / `endAction`
- 若需拖拽排序，配合外部 dnd 容器和 `dragHandleProps`

## 4. Keypad Writeback（小键盘回写）

适用：扫码后人工确认数量、温度、重量等数字字段。

- 行点击触发 `selectRecord`
- 小键盘 `onSubmit` 调用 `applyEditorValue(setRows)`
- 回写完成后提示状态（toast/chip/message）

## 5. Camera Scan Trigger（摄像头扫码）

适用：现场扫 ASN、托盘码、箱码、任务单号。

- 页面放一个显式触发按钮，不要默认占用摄像头
- 使用 `PBarcodeScanner`
- `onDetected` 把扫描结果写回：
  - filter keyword
  - 表单字段
  - 当前任务上下文
- 浏览器不支持 `BarcodeDetector` 时，保留手动录入回退
