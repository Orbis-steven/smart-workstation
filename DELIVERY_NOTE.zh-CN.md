# 智能工作站前端交付说明

## 1. 交付概述

本次交付内容为智能工作站前端的结构化重构与文档补全，目标是将原先“少数超大文件承载大量混合逻辑”的实现方式，调整为“多模块分层、职责清晰、便于后续接入 SAP 与 Modula”的实现方式。

## 2. 本次已完成内容

- 完成前端代码模块化拆分
- 将 Modula、SAP、工作站三个领域的逻辑分层
- 将页面文件调整为编排层，减少单文件代码量
- 明确 SAP 接口预留位置
- 明确 Modula 接口预留位置
- 保留并整理本地 mock 数据体系，便于正式接口接入前联调
- 补充仓库级 AI 协作说明，包括 `AGENTS.md`、`skills/`、`agents/openai.yaml` 的用途说明
- 完成中英文 README 文档整理

## 3. 当前代码结构

当前核心结构如下：

- `src/modules/modula/`
- `src/modules/sap/`
- `src/modules/workstation/`
- `src/components/sap-order/`
- `src/components/workstation/`
- `skills/`
- `AGENTS.md`

其中：

- `src/modules/modula/` 负责 Modula 托盘命名、队列调度、设备接入预留
- `src/modules/sap/` 负责 SAP 查询、更新、库存、物料位置、mock 数据与语音查询解析
- `src/modules/workstation/` 负责工作站二级页面相关接口、语音播报与虚拟网格逻辑
- `skills/` 与 `AGENTS.md` 负责约束 AI 协作开发时的工作方式与路由规则

## 4. 已明确的关键业务规则

- 页面首次进入时不自动查询
- 只有点击 `GO` 后才查询数据
- 托盘命名按 `机器号 + 层数`
- 当前 Modula 机器号为 `1`
- 当前托盘号范围为 `1001` 到 `1090`
- 当前前端方案中，Modula 不负责灯光控制
- 托盘库存查询与 TO 任务数据已分离
- 库存查询显示的是实际库存，不是需求数量

## 5. 后续接口接入预留点

### 5.1 SAP 接口预留

统一放在：

- `src/modules/sap/sapGateway.js`

后续可接入：

- 开放任务查询
- Tray 对应 Bin 查询
- Bin 对应物料查询
- 物料当前位置查询
- 物料库位更新
- 任务状态回写

### 5.2 Modula 接口预留

统一放在：

- `src/modules/modula/deviceGateway.js`

后续可接入：

- 托盘呼叫
- 托盘回库
- 状态读取 / 轮询

### 5.3 Modula 队列规则

统一封装在：

- `src/modules/modula/queueService.js`

如果后续 Modula 编排规则变化，优先修改此模块，而不是重新把逻辑写回页面文件。

## 6. 文档状态

当前仓库已包含：

- 英文版说明：`README.md`
- 中文版说明：`README.zh-CN.md`
- 仓库级 AI 协作规则：`AGENTS.md`

## 7. Git 状态

当前代码已完成提交并推送到 GitHub 主分支：

- 仓库地址：
  - `https://github.com/Orbis-steven/smart-workstation`

## 8. 建议

后续继续迭代时，建议遵守以下约束：

- 新增 SAP 逻辑优先进入 `src/modules/sap/`
- 新增 Modula 逻辑优先进入 `src/modules/modula/`
- 新增工作站页面 / 设备逻辑优先进入 `src/modules/workstation/`
- 页面文件继续只做状态编排与流程组织
- 接口正式接入时同步更新 README，避免文档与实现脱节
