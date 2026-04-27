---
name: orbcafe-pad-workflow
description: Build ORBCAFE touch-first pad experiences with PAppPageLayout, PNavIsland, PWorkloadNav, PTable, PSmartFilter, PNumericKeypad, PBarcodeScanner, PTouchCard, usePadLayout, and usePadRecordEditor using official examples patterns. Use for iPad/平板交互、横竖屏适配、触摸卡片表格、数字键盘录入和摄像头扫码，尤其适用于“UI显示正常但点不动/交互无效”的排查与修复。
---

# ORBCAFE Pad Workflow

## Workflow

1. 对照 `../orbcafe-ui-component-usage/references/module-contracts.md`，确认此任务属于 Pad 触摸模块。
2. 执行安装与本仓库联调启动（必须）。
3. 先复用 `examples/app/_components/PadExampleClient.tsx` 结构，再做业务字段替换。
4. 用 `references/patterns.md` 选组合模式（layout-first / table+keypad / touch-card）。
5. 用 `references/guardrails.md` 检查横竖屏、点击命中、hydration、过滤/布局持久化。
6. 输出可运行代码、验收步骤、排障步骤。

## Installation and Bootstrapping (Mandatory)

```bash
npm install orbcafe-ui @mui/material @mui/icons-material @mui/x-date-pickers @emotion/react @emotion/styled dayjs
```

本仓库联调：

```bash
npm run build
cd examples
npm install
npm run dev
```

参考实现：
- `examples/app/_components/PadExampleClient.tsx`
- `examples/app/pad/page.tsx`
- `src/components/Pad/README.md`
- `src/components/Pad/Hooks/README.md`

## Output Contract

0. `Mode`: `Hook-first`（优先 `usePadLayout` / `usePadRecordEditor`）。
1. `Composition`: 明确使用哪些 Pad 组件（至少 layout/table/filter/keypad 中的相关项）。
2. `Data contract`: 给出最小字段（`rowKey`, 可编辑数量字段, filter fields）。
3. `Verify`: 至少包含 5 条（横竖屏切换、菜单点击、workload 切换、table 操作、keypad 写回）。
4. `Troubleshooting`: 至少 5 条“看得到但点不动”排查项。

## Examples-Based Experience Summary

- `PTable` 目标是保持 `CTable` 功能等价（分页/分组/汇总/布局/变体/quick actions）但交互改为触摸友好行卡片。
- `PSmartFilter` 是 `CSmartFilter` 的触摸包装，不应裁剪原有变体与布局能力。
- 竖屏下优先保证工具按钮和关键动作可点击、右对齐和可见，不追求单屏塞满。
- `PAppPageLayout` 的菜单状态和方向状态必须统一管理，避免 SSR/CSR 首帧方向不一致导致点击层异常。
- 小键盘必须直连业务写回（`onSubmit`），不能只做展示。
- 摄像头扫码优先使用原生 `BarcodeDetector`，但必须保留手动录入回退，否则在 Safari/旧设备上会失效。
