# Frontend Project Rules

This repository keeps project-local Codex skills under `./skills`.

When the user works in this repository, do not require explicit `$skill-name` invocation.
If the user describes a task in natural language, infer the correct local skill from intent,
open `./skills/<skill-name>/SKILL.md`, then load only the references needed for the task.

Prefer the local `./skills` copy over any global skill copy so repository behavior stays versioned with the codebase.

## Default workflow

1. Infer the target skill from the user's request.
2. Open `./skills/<skill-name>/SKILL.md`.
3. Load only the relevant reference files that the selected skill points to.
4. Tell the user in one short line which skill is being applied.
5. Implement the task directly.

If the request is ambiguous, cross-module, or the user only says "based on the skill do X",
start with `orbcafe-ui-component-usage` as the router skill.

## Skill routing map

- `modula-interface`
  Use for ModulaInterface, Modula REST gateway, simulator/live mode, bay status, inbound/outbound jobs, tray return, Modula TCP integration, and machine orchestration constraints.

- `orbcafe-ui-component-usage`
  Use first for ambiguous ORBCAFE UI requests, cross-module requests, or when the user asks for "based on the skill" without naming a module.

- `orbcafe-agentui-chat`
  Use for chat, copilot, assistant panel, AgentPanel, StdChat, CopilotChat, streaming messages, markdown/cards rendering, and card hooks.

- `orbcafe-graph-detail-ai`
  Use for graph, chart, KPI, detail page, detail tabs, searchable detail, drilldown, AI settings, prompt settings, and CustomizeAgent flows.

- `orbcafe-kanban-detail`
  Use for kanban, workflow board, bucket/card drag-drop, controlled board state, and Kanban-to-detail navigation.

- `orbcafe-layout-navigation`
  Use for app shell, layout, navigation, header, menu, locale, i18n, markdown renderer, user menu, and page transitions.

- `orbcafe-pad-workflow`
  Use for pad, tablet, touch-first UI, orientation adaptation, keypad input, barcode scanner, camera scanning, touch cards, and pad table/filter layouts.

- `orbcafe-pivot-ainav`
  Use for pivot, analytics, aggregation, preset persistence, PivotChart, voice navigation, speech input, and space-key voice workflows.

- `orbcafe-stdreport-workflow`
  Use for standard report/list pages, filters, table pages, pagination, variants, layouts, quickCreate, quickEdit, quickDelete, and report orchestration.

## User interaction rule

Inside this repository, accept requests like:

- "帮我基于 skill 做一个 ORBCAFE 聊天页"
- "帮我按 skill 处理这个 Modula 出库问题"
- "这个 ORBCAFE 需求你自己判断该用哪个 skill"

Do not ask the user to type `$modula-interface` or any other explicit skill name unless they ask how manual invocation works.
