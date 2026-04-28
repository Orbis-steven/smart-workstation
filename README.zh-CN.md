# 智能工作站前端说明文档

- English version: `README.md`
- 英文版：`README.md`

## 1. 项目定位

本项目是一个基于 `React + Vite` 的智能工作站前端。

当前范围包括：

- SAP 任务查询界面
- 托盘库存查询
- 物料所在 Tray / Bin 查询
- Modula 托盘队列调度
- 视觉工作站二级页面
- 语音小助手
- 用于模拟 SAP 查询与更新的本地 mock 数据流

当前已经固化的重要业务规则：

- 页面首次进入时不自动查询
- 只有点击 `GO`，或者明确触发语音查询后，才会拉取数据
- Modula 托盘命名规则为 `机器号 + 层数`
- 当前 Modula 机器号为 `1`
- 当前托盘范围为 `1001` 到 `1090`
- 当前前端设计里，Modula 不再承担灯光控制逻辑

## 2. 技术栈

- 语言：`JavaScript`
- UI：`React 19`
- 构建工具：`Vite`
- 表格 / 弹框：`orbcafe-ui`
- 图标：`lucide-react`
- HTTP：`axios`
- 样式：`Tailwind CSS`

## 3. 本次重构结果

重构前，主要存在两个超大文件：

- `src/SapOrderPage.jsx`
- `src/SmartWorkStation.jsx`

重构后，项目拆分为：

- `src/modules/modula/`
- `src/modules/sap/`
- `src/modules/workstation/`
- `src/components/sap-order/`
- `src/components/workstation/`
- `src/i18n/`
- `src/config/`
- `src/hooks/`

这意味着：

- 业务逻辑和界面逻辑已经分离
- SAP 接口预留位置已经集中
- Modula 队列逻辑已经集中
- 工作站接口与虚拟网格逻辑已经集中
- 页面文件改为编排层，不再承载大段混合逻辑

## 4. 目录说明

### 4.1 应用入口

- `src/App.jsx`
  - 顶层外壳
  - 语言 / 主题切换
  - 挂载 `SapOrderPage`

### 4.2 共享配置

- `src/config/api.js`
  - `WORKSTATION_API_URL`
  - `INVENTORY_DATA_PROVIDER`

### 4.3 国际化

- `src/i18n/formatMessage.js`
  - 通用文案格式化工具
- `src/i18n/sapOrderDict.js`
  - SAP 任务页字典
- `src/i18n/workstationDict.js`
  - 工作站页面字典

### 4.4 Modula 层

- `src/modules/modula/config.js`
  - 机器号
  - 层数
  - 虚拟网格维度
  - 队列并发数量
  - 明确标识：不控制灯光

- `src/modules/modula/trayNaming.js`
  - 托盘 / Bin 命名规范
  - 网格坐标换算
  - mock 推荐位置辅助逻辑

- `src/modules/modula/queueService.js`
  - 构建托盘任务
  - 调度 active / waiting / pending 队列
  - 完成当前处理中的托盘
  - 汇总队列状态
  - 行禁用逻辑

- `src/modules/modula/deviceGateway.js`
  - 真实 Modula 接口的前端预留接入点

### 4.5 SAP 层

- `src/modules/sap/mock/`
  - mock 任务数据
  - mock 物料库位数据
  - mock 托盘库存快照

- `src/modules/sap/mockRepository.js`
  - 初始化可变的内存 mock 状态

- `src/modules/sap/sapGateway.js`
  - 真实 SAP 查询 / 更新接口预留位置

- `src/modules/sap/sapInventoryService.js`
  - 托盘库存查询
  - 物料所在位置查询
  - 本地库位转移更新

- `src/modules/sap/sapTaskService.js`
  - 任务查询
  - 托盘库存查询结果组装
  - 物料位置查询结果组装
  - 订单 / 库存快照同步

- `src/modules/sap/sapUpdateService.js`
  - 任务状态更新
  - 物料位置更新

- `src/modules/sap/voiceCommandService.js`
  - 语音命令解析
  - 查询条件提取
  - 语音结果摘要

### 4.6 工作站层

- `src/modules/workstation/api.js`
  - 视觉工作站后端接口调用

- `src/modules/workstation/speech.js`
  - 语音播报封装

- `src/modules/workstation/grid.js`
  - 虚拟网格坐标计算
  - 任务 / 库存格子定位

### 4.7 SAP 任务页组件

- `src/components/sap-order/SearchFilters.jsx`
- `src/components/sap-order/VoiceAssistantPanel.jsx`
- `src/components/sap-order/QueuePanel.jsx`
- `src/components/sap-order/BottomActionBar.jsx`
- `src/components/sap-order/TransferModal.jsx`
- `src/components/sap-order/ManualPickModal.jsx`
- `src/components/sap-order/JobConfirmContent.jsx`
- `src/components/sap-order/tableColumns.jsx`

### 4.8 工作站组件

- `src/components/workstation/ControlBtn.jsx`
- `src/components/workstation/PendingItemsList.jsx`
- `src/components/workstation/InventoryTable.jsx`
- `src/components/workstation/VisionGridPanel.jsx`

### 4.9 Hooks

- `src/hooks/useSpeechRecognition.js`
  - 浏览器语音识别生命周期封装

## 5. 核心页面职责

### 5.1 `src/SapOrderPage.jsx`

该文件现在只负责页面编排：

- 查询状态
- 队列状态
- 弹窗状态
- 语音助手状态
- 从查询页跳转到工作站页

它不再直接承载：

- 托盘命名规则
- Modula 队列算法
- SAP 查询 / 更新实现细节
- 工作站后端接口细节
- 表格列定义细节

### 5.2 `src/SmartWorkStation.jsx`

该文件现在只负责工作站编排：

- 当前工作站状态
- 后端轮询
- 入库 / 出库交互流程
- 处理结果回传查询页

它不再包含：

- Modula 灯光控制调用
- 大量内嵌 UI 辅助组件

## 6. SAP 接口预留位置

所有真实 SAP 集成都集中在：

- `src/modules/sap/sapGateway.js`

当前预留函数：

- `queryOpenTasksFromSap()`
- `queryTrayBinsFromSap()`
- `queryBinMaterialsFromSap()`
- `queryMaterialLocationFromSap()`
- `updateMaterialLocationInSap()`
- `updateTaskStatusInSap()`

### 6.1 当前预期接入关系

#### A. 任务查询

使用：

- `queryOpenTasksFromSap()`

调用方：

- `src/modules/sap/sapTaskService.js`
  - `queryOpenTaskRows()`

#### B. 托盘库存查询

后续真实业务流程为：

1. 前端输入托盘号
2. SAP 返回该 Tray 下所有 Bin
3. 再查询这些 Bin 里的物料
4. 以 JSON 返回给工作站前端

当前预留调用链：

- `src/modules/sap/sapTaskService.js`
  - `buildTrayInventoryRows()`
- `src/modules/sap/sapInventoryService.js`
  - `getTrayInventoryByTray()`
- `src/modules/sap/sapGateway.js`
  - `queryTrayBinsFromSap()`
  - `queryBinMaterialsFromSap()`

#### C. 物料位置查询

使用：

- `queryMaterialLocationFromSap()`

调用方：

- `src/modules/sap/sapInventoryService.js`
  - `getItemLocationByItemNo()`

#### D. 物料位置转移 / 更新

使用：

- `updateMaterialLocationInSap()`

调用方：

- `src/modules/sap/sapInventoryService.js`
  - `updateItemLocation()`
- `src/modules/sap/sapUpdateService.js`
  - `updateMaterialLocation()`

#### E. 任务状态回写

使用：

- `updateTaskStatusInSap()`

调用方：

- `src/modules/sap/sapUpdateService.js`
  - `updateTaskStatus()`

## 7. Modula 接口预留位置

所有真实 Modula 集成都集中在：

- `src/modules/modula/deviceGateway.js`

当前预留函数：

- `requestTrayOpen()`
- `requestTrayReturn()`
- `readTrayStatus()`

### 7.1 关键设计规则

当前前端的设计假设是：

- Modula 只负责托盘 / 任务编排
- Modula 不承担灯光控制

因此，后续如果接真实 Modula：

- 不要把灯光控制重新塞回工作站前端逻辑
- 只接托盘呼叫、托盘回库、状态轮询

### 7.2 队列逻辑模块

Modula 队列调度已完整隔离在：

- `src/modules/modula/queueService.js`

关键函数：

- `buildModulaJobs(rows, type)`
- `scheduleModulaQueue({ jobQueue, activeJobs })`
- `completeProcessingJob({ activeJobs, jobQueue })`
- `getQueueSummary({ jobQueue, activeJobs })`

如果后续 Modula 规则变化，优先修改这个文件。

## 8. Mock 数据策略

当前 mock 数据来源：

- `src/modules/sap/mock/sapOrders.js`
- `src/modules/sap/mock/itemLocationMapping.js`
- `src/modules/sap/mock/trayInventorySnapshot.js`

### 8.1 当前含义

- `sapOrders.js`
  - 入库 / 出库任务 mock 数据源
- `itemLocationMapping.js`
  - 当前物料对应的 Tray / Bin
- `trayInventorySnapshot.js`
  - 托盘库存查询使用的库存快照

### 8.2 已落实的重要规则

托盘库存查询已经和 TO 任务列表分离。

这表示：

- 托盘库存查询不会直接复用 TO 行作为库存行
- 库存查询中展示的是实际库存数量，不是需求数量

### 8.3 数据如何保持一致

任务数据与库存快照之间的同步关系在：

- `src/modules/sap/sapTaskService.js`
  - `syncInventorySnapshotWithOrders()`

库位转移时会同时更新：

- 物料位置映射
- 托盘库存快照

对应逻辑在：

- `src/modules/sap/sapInventoryService.js`
  - `transferMockItemLocation()`

## 9. 模块调用示例

### 9.1 查询开放任务

```js
import { queryOpenTaskRows } from './src/modules/sap/sapTaskService'

const rows = await queryOpenTaskRows({
  filters,
  provider: 'mock',
  orders,
})
```

### 9.2 查询托盘库存

```js
import { buildTrayInventoryRows } from './src/modules/sap/sapTaskService'

const rows = await buildTrayInventoryRows({
  trayId: '1001',
  provider: 'mock',
  inventorySnapshot,
})
```

### 9.3 查询物料位置

```js
import { getItemLocationByItemNo } from './src/modules/sap/sapInventoryService'

const record = await getItemLocationByItemNo({
  itemNo: '7733-2009-113-P01',
  provider: 'mock',
  itemLocationMapping,
})
```

### 9.4 更新物料位置

```js
import { updateMaterialLocation } from './src/modules/sap/sapUpdateService'

const result = await updateMaterialLocation({
  itemNo: '7733-2009-113-P01',
  tray: '1002',
  bin: '1002M01',
  provider: 'mock',
  itemLocationMapping,
  inventorySnapshot,
})
```

### 9.5 构建并调度 Modula 队列

```js
import { buildModulaJobs, scheduleModulaQueue } from './src/modules/modula/queueService'

const jobs = buildModulaJobs(selectedRows, 'outbound')
const next = scheduleModulaQueue({
  jobQueue: jobs,
  activeJobs: [],
})
```

### 9.6 使用语音命令解析

```js
import { parseVoiceCommand } from './src/modules/sap/voiceCommandService'

const command = parseVoiceCommand('帮我查一下今天有哪些出库任务')
```

## 10. 兼容层

为了降低重构风险，以下旧路径仍然保留为 re-export 包装层：

- `src/trayNaming.js`
- `src/sapInventoryService.js`
- `src/mockSapData.js`
- `src/mockItemLocationMapping.js`
- `src/mockTrayInventorySnapshot.js`

这意味着旧代码里的导入路径仍可工作，但新代码应优先使用 `src/modules/...`。

## 11. 本地启动

```powershell
npm install
npm run dev
```

默认前端地址：

- `http://localhost:8108`

视觉后端预期地址：

- `http://127.0.0.1:8100`

## 12. 后续开发约束

后续如需继续迭代：

- SAP 逻辑加到 `src/modules/sap/`
- Modula 逻辑加到 `src/modules/modula/`
- 工作站设备 / 页面逻辑加到 `src/modules/workstation/`
- 可复用 UI 加到 `src/components/...`
- 页面文件继续保持“编排层”职责

不要再把大量混合业务逻辑重新塞回：

- `src/SapOrderPage.jsx`
- `src/SmartWorkStation.jsx`

## 13. 仓库内 Skills 与 Agents 说明

除前端代码外，本仓库还包含一套项目内置的 AI 协作规则：

- `AGENTS.md`
- `skills/*/SKILL.md`
- `skills/*/agents/openai.yaml`
- `skills/*/references/*`

这些文件属于仓库设计的一部分，应与源码一起纳入版本管理。

### 13.1 `AGENTS.md`

`AGENTS.md` 定义了 Codex 在本仓库中的仓库级工作规则。

当前职责包括：

- 优先使用仓库内 `./skills`
- 根据用户意图自动推断应该使用哪个 skill
- 不要求用户必须手工输入 `$skill-name`
- 规定 ORBCAFE / Modula 类任务的默认路由顺序

这意味着仓库本身已经携带一套 AI 协作规范。

### 13.2 本地 Skills 清单

当前本地 skills 包括：

- `skills/modula-interface/`
  - 用于 Modula 接口、Modula REST 网关、模拟 / 实机模式、bay 状态、入库 / 出库任务、托盘回库、设备编排约束
  - 注意：该 skill 文档仍保留独立 Modula 接口项目中的历史灯光约束说明，但在本前端项目里，当前业务规则已经明确为“不做前端侧灯光控制”

- `skills/orbcafe-ui-component-usage/`
  - ORBCAFE UI 路由 skill
  - 用于在需求不明确时判断应该进入哪个 ORBCAFE 模块 skill
  - 同时约束安装、启动与验收基线

- `skills/orbcafe-agentui-chat/`
  - 用于聊天、copilot、助手面板、AgentPanel、StdChat、CopilotChat、流式回复与卡片事件模式

- `skills/orbcafe-graph-detail-ai/`
  - 用于图表、KPI、详情页、详情 tab、钻取、提示词 / AI 设置，以及 detail + AI 流程

- `skills/orbcafe-kanban-detail/`
  - 用于看板、流程桶、卡片拖拽和 kanban-to-detail 交互

- `skills/orbcafe-layout-navigation/`
  - 用于应用外壳、头部、菜单、语言、i18n、markdown 渲染、导航结构

- `skills/orbcafe-pad-workflow/`
  - 用于平板 / PAD 布局、触摸操作、条码扫描、摄像头流程、PAD 优先交互模式

- `skills/orbcafe-pivot-ainav/`
  - 用于透视分析、聚合、预设、PivotChart、语音导航和语音驱动交互

- `skills/orbcafe-stdreport-workflow/`
  - 用于标准报表 / 列表页、筛选、分页、持久化、变体 / 布局与报表编排

### 13.3 `agents/openai.yaml`

每个本地 skill 下都包含：

- `skills/<skill-name>/agents/openai.yaml`

该文件是这个 skill 对应的 agent 侧配置入口。

建议维护方式：

- `SKILL.md` 负责说明人可读的工作流和实现规则
- `agents/openai.yaml` 负责 skill 的 agent / runtime 配置
- skill 行为变化时，两者一起维护

### 13.4 `references/`

部分 skill 带有 `references/` 目录。

这些文件用于承载详细执行规则，例如：

- 组件选型
- guardrails
- 实现 recipes
- 集成基线
- 公共导入 / 导出边界
- 领域模式说明

建议使用方式：

- 不要无差别全部加载
- 只加载当前任务真正需要的 references

### 13.5 Skills 与前端模块之间的关系

当前仓库形成了两套并行但关联的结构：

- `src/` 下的前端运行时代码
- `AGENTS.md` 与 `skills/` 下的 AI 协作规则

建议职责划分：

- `src/modules/modula/` 负责前端中的 Modula 业务编排
- `src/modules/sap/` 负责前端中的 SAP 查询 / 更新接入
- `src/modules/workstation/` 负责工作站页面 / 后端 / 设备辅助逻辑
- `skills/` 与 `AGENTS.md` 负责告诉后续 agent 应该如何正确修改这些模块

换句话说：

- `src/` 定义程序怎么运行
- `skills/` 与 `AGENTS.md` 定义 AI 协作开发时应该怎么改程序

### 13.6 后续更新规则

后续如果 SAP 或 Modula 的接入点发生变化，需要同步更新两类内容：

- `src/modules/...` 中的代码预留点
- `README.md`，必要时也包括 `AGENTS.md` / `skills/...`

这样可以保持实现与 AI 指引的一致性。

## 14. 适合提交到 Git 的文件

建议纳入版本管理：

- `src/`
- `skills/`
- `AGENTS.md`
- `README.md`
- `README.zh-CN.md`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`
- `.gitignore`

不要提交：

- `node_modules/`
- `dist/`
- `.edge-profile/`
