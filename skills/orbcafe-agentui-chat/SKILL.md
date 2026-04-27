---
name: orbcafe-agentui-chat
description: Build ORBCAFE chat and copilot experiences with AgentPanel, StdChat, CopilotChat, ChatMessage typing flow, and AgentUICardHooks using official examples patterns. Use for full-page chat, floating copilot, streaming replies, markdown/cards rendering, and when chat UI appears but send, stream, card actions, drag, or resize behavior has no effect.
---

# ORBCAFE AgentUI Chat


## 这个 Skill 解决什么

用于 ORBCAFE 聊天类 UI 的组件接入与修复，覆盖：

- `AgentPanel`（整页/工作台聊天，支持状态跑马灯 + 彩色光晕）
- `StdChat`（标准消息区 + 输入区）
- `CopilotChat`（浮窗内容层，壳层由页面控制）
- `ChatMessage` streaming 状态流
- `AgentUICardHooks` 卡片事件回传

## 何时必须用这个 Skill

- 用户明确提到 `AgentPanel`、`StdChat`、`CopilotChat`、chat/coplanel。
- UI 渲染出来但交互“没效果”（发送无效、stream 不动、卡片按钮无响应）。
- 需要展示型 agent 面板（只看消息，不要输入框）。
- 需要 agent 运行状态视觉反馈（四边跑马灯 + 彩色光晕）。

## 工作流（必须执行）

1. 对照 `../orbcafe-ui-component-usage/references/module-contracts.md`，确认是 `Component-first`。
2. 读取 `references/component-selection.md`，先选组件再写代码。
3. 参考 `references/recipes.md` 输出最小可运行代码，只用 `orbcafe-ui` 公共 API。
4. 参考 `references/guardrails.md` 检查状态契约与边界（streaming、card hooks、copilot 外壳、AgentPanel 视觉状态）。
5. 给出验收步骤和“没效果”排障。

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

优先参考实现（按场景）：

- `AgentPanel`：`examples/app/aipanel/AIPanelExampleClient.tsx`
- `examples/app/chat/ChatExampleClient.tsx`
- `examples/app/copilot/CopilotExampleClient.tsx`

## 组件选型默认策略

- 需要标题区 + 工作台风格：优先 `AgentPanel`
- 需要展示型面板：`AgentPanel` + `showInput={false}`（默认）
- 仅消息区 + 输入区：`StdChat`
- 浮窗助手：`CopilotChat`（外壳自己做）

## 输出规范（对用户回复必须包含）

1. `Mode`：`Component-first`
2. `Decision`：为什么选 `AgentPanel` / `StdChat` / `CopilotChat`
3. `Minimal code`：可直接粘贴运行，且只从 `orbcafe-ui` 导入
4. `State shape`：
   - 基础：`messages`、`isResponding`
   - AgentPanel 状态化：`agentStatus`
   - Copilot：`isOpen`、`panelPosition`、`panelSize`、`corner`
5. `Verify`：至少 3 条可执行验收步骤
   - AgentPanel 状态化必须覆盖：跑马灯和光晕状态切换
   - Copilot 必须覆盖：打开/关闭、拖拽、缩放
6. `Troubleshooting`：至少 3 条“看得到但没效果”排查项

## 关键约束（默认遵守）

- `StdChat` 的 `showInput` 可控制输入区，默认显示。
- `AgentPanel` 默认 `showInput=false`，是展示型面板。
- `AgentPanel` 的 `agentStatus` 驱动状态点、四边跑马灯和彩色光晕。
- `CopilotChat` 只负责内容，不负责壳（开关/定位/拖拽/缩放）。
- streaming 基线：append assistant message 时 `isStreaming=true`，在 `onMessageStreamingComplete` 改回 `false`。
- 卡片事件统一走 `cardHooks.onCardEvent`，不直接耦合内部 renderer。
