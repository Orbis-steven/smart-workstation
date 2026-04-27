# 智能货柜工作站前端

这是一个基于 `React + Vite` 的 Modula 智能货柜工作站前端演示项目。

## 当前主要功能

- TO 查询与出入库任务展示
- 物料号库位查询
- 托盘库存查询
- 库位转移 mock 记录
- 视觉工作台与语音助手交互
- Modula 托盘命名规则适配

## 本地启动

```powershell
npm install
npm run dev
```

默认开发端口：

- `http://localhost:6681`

## 当前 mock 数据结构

- `src/mockSapData.js`
  - 出入库任务 mock 数据
- `src/mockItemLocationMapping.js`
  - 物料号与 Tray / Bin 映射
- `src/mockTrayInventorySnapshot.js`
  - 托盘库存快照
- `src/sapInventoryService.js`
  - 托盘库存、物料库位查询的 service 封装
  - 已预留后续 SAP 接口接入点

## 建议上传到 Git 的内容

- `src/`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `.gitignore`
- `README.md`

## 不要上传的内容

- `node_modules/`
- `dist/`
- `.edge-profile/`
