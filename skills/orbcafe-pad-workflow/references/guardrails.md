# Pad Guardrails

## Interaction Safety

1. 不要让覆盖层拦截点击：
   - 检查 `Drawer/Modal` 是否在关闭后仍挂载并遮挡。
   - 检查绝对定位层是否误设置 `pointer-events: auto`。
2. 触摸目标建议至少 `40-44px` 高度。
3. `button` 型节点保持语义化（`component="button"` 时禁用原生默认样式并保留 click）。

## Orientation and Hydration

1. 横竖屏判定推荐 `useMediaQuery(..., { noSsr: true })`，避免首屏 hydration 抖动。
2. `orientation='auto'` 场景下，不要在 SSR 阶段写死结构分支导致客户端结构变更过大。
3. 竖屏优先保留关键动作按钮可见性和可点性。

## PTable Parity

1. `PTable` 要维持 `CTable` 功能等价：
   - 分页
   - 分组
   - 汇总
   - 导出
   - layout 保存/加载
   - variant 保存/加载（通过 `PSmartFilter`）
2. 渲染字段若返回 ReactNode，避免包在 `<p>` 导致嵌套警告。

## Keypad Behavior

1. `PNumericKeypad` 必须绑定受控值（`value + onChange`）。
2. `onSubmit` 必须真实写回业务数据，不只打印日志。
3. 写回后同步视觉反馈（例如 chip/message）。

## Barcode Scanner Behavior

1. 不要页面加载即请求摄像头权限，必须由用户点击按钮触发。
2. 扫描成功后，结果必须真实回写到业务状态，不只展示弹窗。
3. 没有 `BarcodeDetector` 时仍需可用，至少提供摄像头预览说明和手动录入。
4. 关闭弹窗时必须释放摄像头 `MediaStream`，否则设备会持续占用摄像头。

## Verify Checklist

1. 竖屏/横屏切换后，菜单按钮、workload 卡、filter/tool 按钮均可点击。
2. `PTable` 工具栏动作区在竖屏仍保持右侧对齐。
3. `PSmartFilter` 变体保存、加载后字段恢复正确。
4. 布局保存后刷新页面可恢复。
5. 小键盘提交后行数据立即更新。
6. 扫码成功或手动输入后，结果立即反映到业务界面。
