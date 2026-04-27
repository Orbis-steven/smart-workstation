---
name: orbcafe-graph-detail-ai
description: Build ORBCAFE graph analytics dialogs, detail pages, and AI settings with CGraphReport, chart components, CDetailInfoPage/useDetailInfo, and CCustomizeAgent using official examples patterns. Use for KPI/chart drilldown, searchable detail tabs, and configurable prompt settings, especially when UI appears rendered but interactions are ineffective.
---

# ORBCAFE Graph + Detail + Agent

## Workflow

1. 先对照 `../orbcafe-ui-component-usage/references/module-contracts.md`，确认这里是混合模块：graph/detail 为 `Hook-first`，agent settings 为 `Component-first`。
2. 用 `references/domain-selector.md` 判定 graph/detail/agent 子域。
3. 执行安装与最小接入。
4. 用 `references/recipes.md` 输出最小可运行片段。
5. 用 `references/guardrails.md` 检查图表联动、详情检索、AI 设置保存一致性。
6. 输出验收步骤与“无效果”排障。

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
- `examples/app/detail-info/[id]/page.tsx`
- `examples/app/detail-info/[id]/DetailInfoExampleClient.tsx`
- `src/components/GraphReport/README.md`
- `src/components/CustomizeAgent/README.md`

## Output Contract

0. `Mode`: `Hook-first` for graph/detail, `Component-first` for agent settings.
1. `Chosen module`: graph/detail/agent and why.
2. `Minimal code`: one focused snippet.
3. `Data model`: model/tabs/sections/settings shape.
4. `Verify`: 图表联动或详情搜索/AI fallback/设置保存至少 3 项可验证行为。
5. `Troubleshooting`: 至少 3 条“看得到 UI 但交互没效果”的排查项。

## Examples-Based Experience Summary

- Detail 动态路由采用 `Server page await params -> Client page` 模式，避免 Next16 参数 Promise 误用。
- `CDetailInfoPage` 搜索优先命中字段，未命中再回退 `ai.onSubmit`，这是稳定体验基线。
- `ai.onSubmit` 返回 Markdown 字符串时保持结构化文本，避免不可预测富文本注入。
- Graph 报表优先接入 `CTable.graphReport` 联动入口；独立 `CGraphReport` 仅在外部需要完全控制 open/model 时使用。
- `CCustomizeAgent.onSaveAll` 必须一次性提交 settings + template ids，防止配置部分成功导致“看似保存但不生效”。
