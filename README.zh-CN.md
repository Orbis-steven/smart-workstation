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
- 视觉工作站页面中的浏览器本机摄像头预览
- 语音小助手
- 用于模拟 SAP 查询与更新的本地 mock 数据流

当前已经固化的重要业务规则：

- 页面首次进入时不自动查询
- 只有点击 `GO`，或者明确触发语音查询后，才会拉取数据
- Modula 托盘命名规则为 `机器号 + 层数`
- 当前 Modula 机器号为 `1`
- 当前托盘范围为 `1001` 到 `1090`
- 当前前端设计里，Modula 不再承担灯光控制逻辑
- 在任务列表页里，点击某一行的任意位置都可以切换该行复选框

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
- `src/hooks/useLocalCamera.js`
  - 视觉工作站页面中的浏览器本机摄像头生命周期封装

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

## 11. 部署与启动说明

### 11.1 组件部署顺序

建议按以下顺序启动：

1. 本仓库中的前端应用
2. 配套视觉后端服务
3. 可选的 SAP 接口实现
4. 可选的 Modula 接口实现
5. 可选的 AI 协作层 `AGENTS.md` 与 `skills/`

### 11.2 组件矩阵

| 组件 | 代码位置 | Demo 是否必需 | 启动命令 | 默认端口 / 地址 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 前端应用 | 本仓库，主要是 `src/` | 是 | `npm run dev` | `http://localhost:8108` | 当前 Git 仓库实际提交和版本管理的是这一部分 |
| 视觉后端 | 外部 FastAPI 配套服务，前端通过 `src/modules/workstation/api.js` 调用 | 工作站状态、扫码绑定、取料校验时必需 | `uvicorn main:app --host 127.0.0.1 --port 8100 --reload` | `http://127.0.0.1:8100` | 后端代码当前不在本仓库中版本管理；浏览器摄像头预览已经改为用户本机侧 |
| SAP 接口层 | `src/modules/sap/sapGateway.js` | 否，mock 模式可独立运行 | 项目自定义 | 项目自定义 | SAP 接口上线后替换预留方法 |
| Modula 接口层 | `src/modules/modula/deviceGateway.js` | 否，mock 队列可独立运行 | 项目自定义 | 项目自定义 | 当前前端不再控制 Modula 灯光 |
| AI 协作层 | `AGENTS.md`、`skills/` | 否 | 无运行进程 | 无 | 方便 Codex 或其他 AI 工具快速理解仓库结构 |

### 11.3 功能依赖矩阵

| 功能 | 仅前端可跑 | 需要视觉后端 | 需要 SAP 接口 | 需要 Modula 接口 | 浏览器 / 硬件要求 |
| --- | --- | --- | --- | --- | --- |
| 任务查询列表 | mock 模式下可以 | 否 | 正式模式需要 | 否 | 现代浏览器 |
| 托盘库存查询 | mock 模式下可以 | 否 | 正式模式需要 | 否 | 现代浏览器 |
| 物料库位查询 / 转移 | mock 模式下可以 | 否 | 正式模式需要 | 否 | 现代浏览器 |
| 语音小助手 | 可以 | 否 | 取决于查询数据来源 | 否 | 浏览器支持语音识别和语音播报 |
| 视觉工作站入库 / 出库 | 不可以 | 需要 | 后续可选同步任务状态 | 后续可选同步托盘状态 | 现代浏览器 + 用户本机摄像头权限 |
| Modula 托盘队列调度 | 当前 mock 流程可跑 | 否 | 可选 | 正式模式需要 | 现代浏览器 |

### 11.4 运行环境要求

| 依赖项 | 在项目中的作用 | 说明 |
| --- | --- | --- |
| `Git` | clone / pull / push 仓库 | 团队协作和部署必需 |
| `Node.js` + `npm` | 运行前端 | `package.json` 没有限定 engine，建议使用兼容当前 Vite / React 工具链的 LTS 版本 |
| `Python 3` | 运行视觉后端 | 只有视觉工作站场景需要 |
| 现代浏览器 | 运行前端 UI | 语音助手推荐 Chrome 或 Edge |
| 用户本机摄像头 | 视觉工作站预览 | 浏览器通过 `getUserMedia()` 打开当前用户本机摄像头 |
| 音频输出设备 | 播放语音助手反馈 | 可选，但建议具备 |

### 11.5 前端 NPM 依赖清单

精确版本以 `package.json` 为准。

运行时依赖：

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| `react` | `^19.2.4` | UI 运行时 |
| `react-dom` | `^19.2.4` | DOM 渲染 |
| `react-router-dom` | `^7.13.2` | 页面路由 |
| `axios` | `^1.14.0` | HTTP 请求 |
| `orbcafe-ui` | `^1.2.1` | 表格和消息弹框组件 |
| `@mui/material` | `^7.3.9` | ORBCAFE 依赖的基础 UI 组件 |
| `@mui/icons-material` | `^7.3.9` | ORBCAFE 依赖的图标包 |
| `@mui/x-date-pickers` | `^8.27.2` | 日期筛选组件 |
| `@emotion/react` | `^11.14.0` | MUI 样式运行时 |
| `@emotion/styled` | `^11.14.1` | MUI 样式运行时 |
| `dayjs` | `^1.11.20` | 日期处理 |
| `lucide-react` | `^1.7.0` | 图标库 |
| `tailwindcss` | `^4.2.2` | 样式系统 |
| `@tailwindcss/vite` | `^4.2.2` | Tailwind 与 Vite 集成 |

开发依赖：

| 包名 | 版本 | 用途 |
| --- | --- | --- |
| `vite` | `^8.0.1` | 开发服务器与构建 |
| `@vitejs/plugin-react` | `^6.0.1` | React 的 Vite 插件 |
| `eslint` | `^9.39.4` | 代码检查 |
| `@eslint/js` | `^9.39.4` | ESLint 配置辅助 |
| `eslint-plugin-react-hooks` | `^7.0.1` | React Hooks 检查 |
| `eslint-plugin-react-refresh` | `^0.5.2` | React Refresh 检查 |
| `globals` | `^17.4.0` | ESLint 全局变量定义 |
| `@types/react` | `^19.2.14` | 编辑器 / 工具类型支持 |
| `@types/react-dom` | `^19.2.3` | 编辑器 / 工具类型支持 |

### 11.6 配套视觉后端 Python 依赖

虽然视觉后端代码当前不在本仓库中，但当前前端联调依赖的配套后端 Python 依赖为：

| 包名 | 来源 | 用途 |
| --- | --- | --- |
| `fastapi` | 配套后端 `requirements.txt` | REST API |
| `uvicorn` | 配套后端 `requirements.txt` | ASGI 服务启动 |
| `opencv-python-headless` | 配套后端 `requirements.txt` | 摄像头取流与图像差分 |
| `numpy` | 配套后端 `requirements.txt` | 图像 / 网格计算 |
| `sqlalchemy` | 配套后端 `requirements.txt` | 本地库存持久化 |
| `pydantic` | 配套后端 `requirements.txt` | 请求 / 响应模型 |

当前前端所依赖的视觉后端接口包括：

- `GET /state`
- `POST /event/vision_session`
- `POST /event/mode`
- `POST /event/scan`
- `POST /event/pick`
- `POST /event/sensor_in`
- `POST /event/sensor_out`
- `POST /event/reset`
- `GET /item-location`
- `POST /item-location`

当前重要架构规则：

- 二级工作站页面中的摄像头预览，已经改为浏览器本机摄像头
- 工作站业务接口仍然继续使用 `8100` 后端
- 也就是说：
  - 本机摄像头画面 = 浏览器侧
  - 任务状态 / 扫码 / 取料 / 差分 / 重置 = 后端侧

### 11.7 前端部署步骤

1. clone 仓库。
2. 进入仓库根目录。
3. 安装前端依赖。
4. 检查 `src/config/api.js` 中的工作站后端地址和数据提供者。
5. 启动开发模式，或者构建生产包。

```powershell
git clone <your-repository-url>
cd smart-workstation
npm install
npm run dev
```

生产构建命令：

```powershell
npm run build
npm run preview
```

当前前端默认运行参数：

- 前端开发地址：`http://localhost:8108`
- 本地开发时的工作站后端地址：`http://127.0.0.1:8100`
- 部署环境下的工作站后端地址：默认同源，或显式配置 `VITE_WORKSTATION_API_URL`
- 数据提供者：`mock`

重要配置规则：

- 当前仓库支持 `import.meta.env.VITE_WORKSTATION_API_URL`
- 如果 `VITE_WORKSTATION_API_URL` 为空：
  - 本地浏览器访问时使用 `http://127.0.0.1:8100`
  - 云上部署页面默认使用 `window.location.origin`
- 如果工作站后端端口或地址变化，优先调整部署配置；只有默认回退策略本身要变时，才修改 `src/config/api.js`

### 11.8 配套视觉后端部署步骤

本仓库不包含视觉后端运行时代码，因此必须额外准备一个配套视觉后端工程或部署包。

建议的配套后端启动流程：

1. 准备后端项目目录。
2. 根据它自己的 `requirements.txt` 安装 Python 依赖。
3. 在 `8100` 端口启动 FastAPI。
4. 验证前端能访问 `/state`、`/event/*` 和 `/item-location`。
5. 验证浏览器能够打开用户本机摄像头。

示例启动命令：

```powershell
cd <vision-backend-directory>
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8100 --reload
```

重要说明：

- 当前后端联调由前端运行时地址解析控制：
  - 本地回退：`127.0.0.1:8100`
  - 部署回退：同源地址
  - 显式覆盖：`VITE_WORKSTATION_API_URL`
- 前端首屏不能自动查询数据
- 二级视觉工作站页面要正常工作，必须同时满足：
  - 浏览器已获得本机摄像头权限
  - 工作站后端的事件/状态接口可用

### 11.9 SAP 接口部署步骤

当前默认模式是本地 mock 模式。

如果保持 mock 模式：

- `src/config/api.js` 中保留 `INVENTORY_DATA_PROVIDER = 'mock'`
- 继续使用：
  - `src/modules/sap/mock/sapOrders.js`
  - `src/modules/sap/mock/itemLocationMapping.js`
  - `src/modules/sap/mock/trayInventorySnapshot.js`

如果接入真实 SAP：

1. 实现 `src/modules/sap/sapGateway.js` 中的预留方法。
2. 保持查询编排逻辑在 `src/modules/sap/sapTaskService.js` 和 `src/modules/sap/sapUpdateService.js`。
3. 保持“托盘库存查询”和 “TO 任务列表”分离。
4. 保持库存查询显示“实际库存数量”，而不是“需求数量”。

需要实现的 SAP 预留方法：

- `queryOpenTasksFromSap()`
- `queryTrayBinsFromSap()`
- `queryBinMaterialsFromSap()`
- `queryMaterialLocationFromSap()`
- `updateMaterialLocationInSap()`
- `updateTaskStatusInSap()`

### 11.10 Modula 接口部署步骤

当前默认模式是前端侧队列模拟与业务编排。

如果接入真实 Modula：

1. 实现：
   - `requestTrayOpen()`
   - `requestTrayReturn()`
   - `readTrayStatus()`
2. 保持托盘命名规则 `机器号 + 层数`
3. 保持当前托盘范围 `1001` 到 `1090`
4. 保持队列调度逻辑集中在 `src/modules/modula/queueService.js`
5. **不要** 把灯光控制重新加回前端

当前的重要队列规则：

- 前端用户只按顺序完成托盘任务
- “最多 2 个托盘同时工作”是给 Modula 编排层的限制，不是给前端用户的操作限制

### 11.11 部署后验收清单

启动完成后，至少检查：

1. 首次打开页面不能自动查询数据。
2. 点击 `GO` 后才触发查询。
3. 托盘库存查询显示的是实际库存，不是需求数量。
4. 物料库位查询支持库位转移弹窗流程。
5. 语音助手在 `zh`、`en`、`de` 下都能继续工作。
6. 若视觉后端已启动，二级工作站页面要能打开用户本机浏览器摄像头，并正确显示后端驱动的虚拟网格高亮。
7. 在任务查询模式下，点击一整行任意位置都应能切换该行复选框。

### 11.12 给其他 AI 工具的快速读取清单

如果其他 AI 工具只 clone 了这个仓库，建议按以下顺序读取：

1. `README.md`
2. `README.zh-CN.md`
3. `AGENTS.md`
4. `package.json`
5. `src/config/api.js`
6. `src/modules/sap/sapGateway.js`
7. `src/modules/modula/deviceGateway.js`
8. `src/modules/workstation/api.js`
9. `src/modules/modula/config.js`
10. `src/modules/sap/mockRepository.js`

AI 工具最需要先知道的业务规则：

- 页面首屏不能自动查询
- 只有点击 `GO` 或明确的语音命令后才允许查询
- Modula 托盘命名规则是 `机器号 + 层数`
- 当前托盘范围是 `1001` 到 `1090`
- 前端不控制 Modula 灯光
- 托盘库存查询与 TO 任务列表分离
- 本机摄像头预览属于浏览器侧，不属于后端侧
- 工作站业务接口仍然继续使用配套后端
- 任务列表支持点击整行切换复选框
- 视觉后端是外部配套服务，不是本仓库中已经提交的一部分

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
