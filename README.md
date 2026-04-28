# Smart Workstation Frontend Skill Guide

- Chinese version: `README.zh-CN.md`
- 中文版：`README.zh-CN.md`

## 1. Project Purpose

This project is a `React + Vite` frontend for the smart workstation.

Current scope:

- Workstation UI for SAP task query, tray inventory query, material location query
- Modula tray queue orchestration
- Vision workstation page
- Voice assistant
- Local mock data flow for SAP query/update simulation

Important business rule already preserved:

- The page must not query data on first load
- Data is only queried after clicking `GO` or after an explicit voice command triggers a query
- Modula tray naming rule is `machineNo + level`
- Current Modula machine number is `1`
- Current tray range is `1001` to `1090`
- Modula no longer controls light hardware in this frontend design

## 2. Tech Stack

- Language: `JavaScript`
- UI: `React 19`
- Build tool: `Vite`
- Table / message box: `orbcafe-ui`
- UI icons: `lucide-react`
- HTTP: `axios`
- Styling: `Tailwind CSS`

## 3. Refactor Result

The previous structure had two giant files:

- `src/SapOrderPage.jsx`
- `src/SmartWorkStation.jsx`

Now the project is split into:

- `src/modules/modula/`
- `src/modules/sap/`
- `src/modules/workstation/`
- `src/components/sap-order/`
- `src/components/workstation/`
- `src/i18n/`
- `src/config/`
- `src/hooks/`

This means:

- business logic is separated from UI
- SAP interface placeholders are centralized
- Modula queue logic is centralized
- workstation API and grid logic are centralized
- page files are now orchestrators instead of giant mixed files

## 4. Directory Guide

### 4.1 App Entry

- `src/App.jsx`
  - top-level shell
  - locale/theme switching
  - mounts `SapOrderPage`

### 4.2 Shared Config

- `src/config/api.js`
  - `WORKSTATION_API_URL`
  - `INVENTORY_DATA_PROVIDER`

### 4.3 I18n

- `src/i18n/formatMessage.js`
  - shared message formatter
- `src/i18n/sapOrderDict.js`
  - SAP order page dictionary
- `src/i18n/workstationDict.js`
  - workstation page dictionary

### 4.4 Modula Layer

- `src/modules/modula/config.js`
  - machine number
  - level count
  - grid dimensions
  - queue concurrency count
  - explicit flag: no light control

- `src/modules/modula/trayNaming.js`
  - tray/bin naming normalization
  - grid position conversion
  - random mock recommendation helpers

- `src/modules/modula/queueService.js`
  - build tray jobs
  - schedule active/waiting/pending jobs
  - complete current processing tray
  - queue summary
  - row disabled logic

- `src/modules/modula/deviceGateway.js`
  - reserved integration points for real Modula interface

### 4.5 SAP Layer

- `src/modules/sap/mock/`
  - mock task data
  - mock material location data
  - mock tray inventory snapshot

- `src/modules/sap/mockRepository.js`
  - initializes mutable in-memory mock state

- `src/modules/sap/sapGateway.js`
  - all real SAP query/update reserved methods

- `src/modules/sap/sapInventoryService.js`
  - tray inventory query
  - material location query
  - local transfer update

- `src/modules/sap/sapTaskService.js`
  - task query
  - tray inventory row building
  - location query row building
  - order/inventory snapshot sync

- `src/modules/sap/sapUpdateService.js`
  - task status update
  - material location update

- `src/modules/sap/voiceCommandService.js`
  - voice command parsing
  - search filter extraction
  - voice result summary generation

### 4.6 Workstation Layer

- `src/modules/workstation/api.js`
  - all vision workstation backend API calls

- `src/modules/workstation/speech.js`
  - speech synthesis wrapper

- `src/modules/workstation/grid.js`
  - virtual grid coordinate helpers
  - task/inventory cell positioning

### 4.7 SAP Order Components

- `src/components/sap-order/SearchFilters.jsx`
- `src/components/sap-order/VoiceAssistantPanel.jsx`
- `src/components/sap-order/QueuePanel.jsx`
- `src/components/sap-order/BottomActionBar.jsx`
- `src/components/sap-order/TransferModal.jsx`
- `src/components/sap-order/ManualPickModal.jsx`
- `src/components/sap-order/JobConfirmContent.jsx`
- `src/components/sap-order/tableColumns.jsx`

### 4.8 Workstation Components

- `src/components/workstation/ControlBtn.jsx`
- `src/components/workstation/PendingItemsList.jsx`
- `src/components/workstation/InventoryTable.jsx`
- `src/components/workstation/VisionGridPanel.jsx`

### 4.9 Hooks

- `src/hooks/useSpeechRecognition.js`
  - browser speech recognition lifecycle wrapper

## 5. Core Page Responsibilities

### 5.1 `src/SapOrderPage.jsx`

This file is now only the orchestration layer for:

- search state
- queue state
- modal state
- voice assistant state
- transition from query page to workstation page

It does not directly own:

- tray naming rules
- Modula queue algorithm
- SAP query/update implementation details
- workstation backend API implementation
- table column definition details

### 5.2 `src/SmartWorkStation.jsx`

This file is now only the orchestration layer for:

- current workstation state
- backend polling
- inbound/outbound action flow
- result propagation back to the queue page

It no longer contains:

- Modula light control calls
- mixed UI helper components inside one huge file

## 6. SAP Integration Reserved Points

All real SAP integration placeholders are centralized in:

- `src/modules/sap/sapGateway.js`

Reserved functions:

- `queryOpenTasksFromSap()`
- `queryTrayBinsFromSap()`
- `queryBinMaterialsFromSap()`
- `queryMaterialLocationFromSap()`
- `updateMaterialLocationInSap()`
- `updateTaskStatusInSap()`

### 6.1 Current Intended Future Mapping

#### A. Task Query

Use:

- `queryOpenTasksFromSap()`

Called by:

- `src/modules/sap/sapTaskService.js`
  - `queryOpenTaskRows()`

#### B. Tray Inventory Query

Target future business flow:

1. query tray number from frontend
2. SAP returns all bins in this tray
3. query materials in those bins
4. return JSON to workstation

Reserved call chain:

- `src/modules/sap/sapTaskService.js`
  - `buildTrayInventoryRows()`
- `src/modules/sap/sapInventoryService.js`
  - `getTrayInventoryByTray()`
- `src/modules/sap/sapGateway.js`
  - `queryTrayBinsFromSap()`
  - `queryBinMaterialsFromSap()`

#### C. Material Location Query

Use:

- `queryMaterialLocationFromSap()`

Called by:

- `src/modules/sap/sapInventoryService.js`
  - `getItemLocationByItemNo()`

#### D. Material Location Transfer / Update

Use:

- `updateMaterialLocationInSap()`

Called by:

- `src/modules/sap/sapInventoryService.js`
  - `updateItemLocation()`
- `src/modules/sap/sapUpdateService.js`
  - `updateMaterialLocation()`

#### E. Task Completion Status Update

Use:

- `updateTaskStatusInSap()`

Called by:

- `src/modules/sap/sapUpdateService.js`
  - `updateTaskStatus()`

## 7. Modula Integration Reserved Points

All real Modula integration placeholders are centralized in:

- `src/modules/modula/deviceGateway.js`

Reserved functions:

- `requestTrayOpen()`
- `requestTrayReturn()`
- `readTrayStatus()`

### 7.1 Important Design Rule

This frontend currently assumes:

- Modula only needs tray/task orchestration
- Modula does not need light control

So if you connect a real Modula interface later:

- do not add light-control responsibilities back into workstation logic
- integrate tray open / tray return / status polling only

### 7.2 Queue Logic Module

Modula queue orchestration is fully isolated in:

- `src/modules/modula/queueService.js`

Key functions:

- `buildModulaJobs(rows, type)`
- `scheduleModulaQueue({ jobQueue, activeJobs })`
- `completeProcessingJob({ activeJobs, jobQueue })`
- `getQueueSummary({ jobQueue, activeJobs })`

If future Modula rules change, adjust this file first.

## 8. Mock Data Strategy

Current mock sources:

- `src/modules/sap/mock/sapOrders.js`
- `src/modules/sap/mock/itemLocationMapping.js`
- `src/modules/sap/mock/trayInventorySnapshot.js`

### 8.1 Current Meaning

- `sapOrders.js`
  - inbound/outbound task mock source
- `itemLocationMapping.js`
  - current material to tray/bin mapping
- `trayInventorySnapshot.js`
  - tray inventory snapshot used for inventory query

### 8.2 Important Rule Already Enforced

Tray inventory query is separated from TO task list.

That means:

- tray inventory query does not directly reuse TO rows as inventory rows
- inventory quantity is shown as actual inventory, not required quantity

### 8.3 How They Stay Consistent

Order task data and inventory snapshot are linked by:

- `src/modules/sap/sapTaskService.js`
  - `syncInventorySnapshotWithOrders()`

Location transfer updates both:

- material location mapping
- tray inventory snapshot

through:

- `src/modules/sap/sapInventoryService.js`
  - `transferMockItemLocation()`

## 9. How To Call Modules

### 9.1 Query Open Tasks

```js
import { queryOpenTaskRows } from './src/modules/sap/sapTaskService'

const rows = await queryOpenTaskRows({
  filters,
  provider: 'mock',
  orders,
})
```

### 9.2 Query Tray Inventory

```js
import { buildTrayInventoryRows } from './src/modules/sap/sapTaskService'

const rows = await buildTrayInventoryRows({
  trayId: '1001',
  provider: 'mock',
  inventorySnapshot,
})
```

### 9.3 Query Material Location

```js
import { getItemLocationByItemNo } from './src/modules/sap/sapInventoryService'

const record = await getItemLocationByItemNo({
  itemNo: '7733-2009-113-P01',
  provider: 'mock',
  itemLocationMapping,
})
```

### 9.4 Update Material Location

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

### 9.5 Build and Schedule Modula Jobs

```js
import { buildModulaJobs, scheduleModulaQueue } from './src/modules/modula/queueService'

const jobs = buildModulaJobs(selectedRows, 'outbound')
const next = scheduleModulaQueue({
  jobQueue: jobs,
  activeJobs: [],
})
```

### 9.6 Use Voice Command Parsing

```js
import { parseVoiceCommand } from './src/modules/sap/voiceCommandService'

const command = parseVoiceCommand('帮我查一下今天有哪些出库任务')
```

## 10. Compatibility Layer

To reduce refactor risk, these old paths still exist as re-export wrappers:

- `src/trayNaming.js`
- `src/sapInventoryService.js`
- `src/mockSapData.js`
- `src/mockItemLocationMapping.js`
- `src/mockTrayInventorySnapshot.js`

This means older imports can still work while new code should prefer `src/modules/...`.

## 11. Local Start

```powershell
npm install
npm run dev
```

Default frontend URL:

- `http://localhost:8108`

Vision backend expected URL:

- `http://127.0.0.1:8100`

## 12. Recommended Development Rule

For future changes:

- add SAP logic into `src/modules/sap/`
- add Modula logic into `src/modules/modula/`
- add workstation device/page logic into `src/modules/workstation/`
- add reusable UI into `src/components/...`
- keep page files focused on orchestration only

Do not put new large mixed business logic back into:

- `src/SapOrderPage.jsx`
- `src/SmartWorkStation.jsx`

## 13. Repository Skills And Agents

This repository contains a project-local AI workflow layer in addition to the frontend code:

- `AGENTS.md`
- `skills/*/SKILL.md`
- `skills/*/agents/openai.yaml`
- `skills/*/references/*`

These files are part of the repository design and should be versioned together with the source code.

### 13.1 `AGENTS.md`

`AGENTS.md` defines the repository-level operating rules for Codex in this project.

Current responsibilities:

- prefer local `./skills` over global skills
- infer the correct skill from user intent
- avoid requiring explicit `$skill-name` input from the user
- define the default routing order for ORBCAFE- and Modula-related tasks

This means the repository itself carries its own AI collaboration rules.

### 13.2 Local Skills Inventory

The current local skills are:

- `skills/modula-interface/`
  - used for Modula interface, Modula REST gateway, simulator/live mode, bay status, inbound/outbound jobs, tray return, and machine orchestration constraints
  - note: this skill document still mentions historical light lifecycle constraints for the standalone Modula interface project, but in this frontend project the current business rule is that frontend-side Modula light control is not used

- `skills/orbcafe-ui-component-usage/`
  - router skill for ambiguous ORBCAFE UI tasks
  - decides which ORBCAFE module skill should be applied
  - enforces install/startup/verification baseline

- `skills/orbcafe-agentui-chat/`
  - chat, copilot, assistant panel, AgentPanel, StdChat, CopilotChat, streaming, and card event patterns

- `skills/orbcafe-graph-detail-ai/`
  - graph, KPI, detail page, detail tabs, drilldown, prompt/AI settings, and detail+AI flows

- `skills/orbcafe-kanban-detail/`
  - kanban board, workflow buckets, drag-drop cards, and kanban-to-detail interaction

- `skills/orbcafe-layout-navigation/`
  - app shell, header, menu, locale, i18n, markdown renderer, and navigation structure

- `skills/orbcafe-pad-workflow/`
  - tablet/pad layout, touch interaction, barcode scanning, camera workflow, and pad-first operating patterns

- `skills/orbcafe-pivot-ainav/`
  - pivot analysis, aggregation, presets, PivotChart, voice navigation, and speech-driven navigation

- `skills/orbcafe-stdreport-workflow/`
  - standard report/list pages, filters, pagination, persistence, variants/layout, and report orchestration

### 13.3 `agents/openai.yaml`

Each local skill contains:

- `skills/<skill-name>/agents/openai.yaml`

This file is the agent-side configuration entry for that skill.

Recommended maintenance rule:

- keep `SKILL.md` focused on human-readable workflow and implementation rules
- keep `agents/openai.yaml` focused on agent/runtime configuration for that skill
- update both together when the skill behavior changes

### 13.4 `references/`

Some skills contain `references/` folders.

These files are the detailed playbooks for:

- component selection
- guardrails
- implementation recipes
- integration baselines
- public import/export boundaries
- domain-specific patterns

Recommended usage:

- do not load all references blindly
- only load the references needed by the active task

### 13.5 Relationship Between Skills And Frontend Modules

The repository now has two parallel but connected structures:

- runtime/frontend code under `src/`
- AI collaboration rules under `AGENTS.md` and `skills/`

Suggested responsibility split:

- use `src/modules/modula/` for actual Modula business orchestration in the frontend
- use `src/modules/sap/` for actual SAP query/update integration in the frontend
- use `src/modules/workstation/` for workstation page/backend/device helpers
- use `skills/` and `AGENTS.md` to tell future agents how to work on those modules correctly

In other words:

- `src/` defines how the application runs
- `skills/` and `AGENTS.md` define how AI-assisted development should modify the application

### 13.6 Future Update Rule

When future SAP or Modula integration points change, update both:

- code placeholders in `src/modules/...`
- repository guidance in `README.md`, and if necessary `AGENTS.md` / `skills/...`

This keeps implementation and AI instructions aligned.

## 14. Files Suitable For Git

Include:

- `src/`
- `skills/`
- `AGENTS.md`
- `README.md`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`
- `.gitignore`

Do not include:

- `node_modules/`
- `dist/`
- `.edge-profile/`
