# FlowOps 导出节点（Excel / PPTX）· Codex 执行计划

> 执行者：Codex（无本项目上下文）。本文件自包含。**逐节点执行，每个节点一个 commit，过门禁再做下一个；任何门禁失败停下报告，不要猜改核心。**
> 目标：在已验证的「文档导出」范式基础上，补 **表格导出(xlsx)** 和 **演示文稿导出(pptx)** 两个 AgentflowV2 节点（txt/md/docx 已由 DocumentExport 覆盖）。

---

## 0. 须知

### 0.1 环境 / 分支

-   仓库根 `/Volumes/project/Flowise`；**Node 20**（`nvm use 20`）。
-   **在分支 `feat/doc-export` 上工作**（`git switch feat/doc-export`）。**不要 push、不碰 main**，做完留人工 review。
-   节点目录：`packages/components/nodes/agentflow/<NodeDir>/`。

### 0.2 ✅ 唯一参考范式（已实战验证，照抄它）

`packages/components/nodes/agentflow/DocumentExport/DocumentExport.ts` + 同目录 `.test.ts`。它已跑通"生成 → 存储 → 下载"闭环，**新节点 100% 复用它的这几处**：

-   AgentflowV2 节点结构：`implements INode`，`run(nodeData, _input, options)`，返回 `{ id, name, input, output: { content, fileName, fileUrl }, state }`。
-   运行时取值：`options.orgId` / `options.chatflowid` / `options.chatId` / `options.agentflowRuntime?.state`。
-   存储（路径顺序固定）：`await addSingleFileToStorage(mime, buffer, fileName, orgId, chatflowid, chatId)`（从 `'../../../src/storageUtils'` 导入）。
-   下载链接：`/api/v1/get-upload-file?chatflowId=${enc(chatflowid)}&chatId=${enc(chatId)}&fileName=${enc(fileName)}&download=true`（强制 attachment 下载）；放进 `output.content` 的 markdown 链接里：`📄 已生成文档 **${fileName}** —— [点击下载](${fileUrl})`。
-   **空内容保护**：`if (!content.trim())` 直接返回提示（不生成空文件）。
-   **Content 输入**：`type:'string', rows:6, acceptVariable:true`，用户用 `{{ ... }}` 引用上游节点输出（运行时已自动解析）。

### 0.3 ⚠️ 头号陷阱：加依赖**不要用 `pnpm add`**

`pnpm add` 会连带把 `@types/node` 从 22.16.3 升到 25.x，导致上游文件 tsc 报 `.at()` 错（components tsconfig 是 ES2020）。**正确做法**：

1. 先 `git checkout main -- pnpm-lock.yaml`（确保 lockfile 干净基线）——若 feat/doc-export 已含 docx 的 lockfile 改动则跳过此步、直接在现有 lockfile 上加。
2. **手动**编辑 `packages/components/package.json` 的 `dependencies`，按字母序加入依赖（`exceljs` / `pptxgenjs`）。
3. 跑 **`pnpm install`**（reconcile，不是 `pnpm add`）。
4. 验证：`cd packages/components && npx tsc --noEmit` **必须 0 错**。若出现 `@types/node`/`.at()` 相关错误，说明 @types/node 又被升了 → 停下报告（别硬改上游文件）。

### 0.4 验证（每个节点必须过）

-   `cd packages/components && npx tsc --noEmit` = 0 错
-   `cd packages/components && npx jest <NodeName>` 全过（测试要**解包生成的文件验证真实内容**，见各节点）
-   `pnpm --filter flowise-components build` 通过（节点进 dist）
-   报告里列"待人工真机验证"：画布里把节点接在 LLM 后、Content 引用其输出、运行、点下载链接确认能下到**有内容**的文件。

### 0.5 提交规范

-   一个节点一个 commit：`feat(components): 新增「<节点名>」AgentflowV2 导出节点`，结尾 `Co-Authored-By: Codex <noreply@openai.com>`。
-   husky 跑 prettier+eslint；注释里别出现 `*/`（会提前闭合块注释，踩过）。

### 0.6 边界

-   只新增 `nodes/agentflow/<Dir>/*` + 改 `package.json`/`pnpm-lock.yaml`。**不改核心、不碰 UI、不碰既有节点。**
-   不造不存在的库/API；拿不准的 API 先查官方文档。

---

## 1. T1 · 表格导出（Excel / .xlsx）

-   目录 `nodes/agentflow/SpreadsheetExport/`，文件 `SpreadsheetExport.ts` + `spreadsheetexport.svg` + `SpreadsheetExport.test.ts`
-   节点：`label:'表格导出'`，`name:'spreadsheetExportAgentflow'`，`type:'SpreadsheetExport'`，`category:'Agent Flows'`，`color` 自选（如 `#21A366`），`icon:'spreadsheetexport.svg'`
-   依赖：**exceljs**（MIT，纯 JS）
-   inputs：
    -   `docExportContent`（Content，string/rows:6/acceptVariable）——表格数据
    -   `sheetName`（string，可选，默认 `Sheet1`）
    -   `docExportFileName`（string，可选，additionalParams）
-   输入解析（按这个顺序）：
    -   `JSON.parse(content)`；若是**对象数组** `[{a:1,b:2},...]` → 表头=各对象 key 的并集（首次出现顺序）、每行=对应值；
    -   若是**二维数组** `[[..],[..]]` → 直接当行；
    -   解析失败/非表格 → 走空内容保护式提示（"请提供 JSON 表格数据：对象数组或二维数组"）。
-   生成（exceljs API）：
    ```ts
    const ExcelJS = require('exceljs')
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet(sheetName || 'Sheet1')
    ws.addRow(headerRow) // 表头
    for (const r of dataRows) ws.addRow(r)
    ws.getRow(1).font = { bold: true } // 表头加粗
    const buffer = Buffer.from(await wb.xlsx.writeBuffer())
    ```
-   mime：`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，文件名 `${base}.xlsx`
-   存储 + 下载链接：照 0.2。
-   测试：feed 对象数组 → 生成 buffer → **用 exceljs 重新读 buffer**（`await new ExcelJS.Workbook().xlsx.load(buffer)`）断言 worksheet 行数/单元格值正确；+ mime/文件名/存储路径顺序、空内容保护。

## 2. T2 · 演示文稿导出（PPTX / .pptx）

-   目录 `nodes/agentflow/PptxExport/`，文件 `PptxExport.ts` + `pptxexport.svg` + `PptxExport.test.ts`
-   节点：`label:'PPT 导出'`，`name:'pptxExportAgentflow'`，`type:'PptxExport'`，`category:'Agent Flows'`，`color` 自选（如 `#D24726`），`icon`
-   依赖：**pptxgenjs**（MIT，纯 JS）
-   inputs：`docExportContent`（Content）+ `docExportFileName`（可选）
-   输入解析（兼容 PPT Deck Agent 的输出形状）：`JSON.parse(content)`：
    -   取标题：`data.deckTitle || data.title`（可选，做封面页）
    -   取幻灯片数组：`data.slides`（若 data 本身是数组则用它）
    -   每个 slide：`title`（或 `heading`）、要点 `bullets`（字符串数组，或对象数组取其字符串字段）、备注 `speakerNotes || notes`
    -   解析失败/无 slides → 提示（"请提供 JSON：slides 数组，每页含 title 与 bullets"）。
-   生成（pptxgenjs API）：
    ```ts
    const pptxgen = require('pptxgenjs')
    const pptx = new pptxgen()
    // 可选封面
    if (deckTitle) {
        const s = pptx.addSlide()
        s.addText(deckTitle, { x: 0.5, y: 2, w: 9, h: 1.5, fontSize: 32, bold: true, align: 'center' })
    }
    for (const slide of slides) {
        const s = pptx.addSlide()
        s.addText(slide.title || '', { x: 0.5, y: 0.3, w: 9, h: 1, fontSize: 24, bold: true })
        const bullets = (slide.bullets || []).map((b) =>
            typeof b === 'string' ? b : Object.values(b).find((v) => typeof v === 'string') || ''
        )
        if (bullets.length)
            s.addText(
                bullets.map((t) => ({ text: t, options: { bullet: true } })),
                { x: 0.7, y: 1.5, w: 8.6, h: 4, fontSize: 16 }
            )
        if (slide.speakerNotes || slide.notes) s.addNotes(String(slide.speakerNotes || slide.notes))
    }
    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer
    ```
-   mime：`application/vnd.openxmlformats-officedocument.presentationml.presentation`，文件名 `${base}.pptx`
-   存储 + 下载链接：照 0.2。
-   测试：feed `{deckTitle, slides:[{title, bullets:[...]}]}` → 生成 buffer → **用 jszip 解包**（`const JSZip=require('jszip'); const zip=await JSZip.loadAsync(buffer)`）读 `ppt/slides/slide1.xml`，断言含某页 title/bullet 文字；+ mime/文件名/空内容保护。

---

## 3. 每节点步骤

1. 按 0.3 加依赖（手动 package.json + `pnpm install`），验 tsc 0。
2. 写节点 .ts（复用 DocumentExport 的 options/存储/下载链接/空保护）+ 简单 svg 图标。
3. 写 .test.ts（**解包/重读验证真实内容** + mime/文件名/存储路径顺序/空保护）。
4. `npx tsc --noEmit`=0、`npx jest <NodeName>` 全过、`pnpm --filter flowise-components build` 过。
5. 单独 commit。下一个。

## 4. 验收（DoD）

-   2 个节点 + 2 个测试，tsc 0 / jest 全过 / 构建进 dist。
-   文件存储路径 `(orgId, chatflowid, chatId)`、下载链接带 `download=true`、空内容有保护。
-   依赖添加未连带破坏 tsc（@types/node 未被强升）。
-   各自独立 commit，全在 `feat/doc-export`，未 push、未并 main。
-   报告列"待人工真机验证"清单（每个节点接 LLM 后跑一次、点下载确认有内容）。

## 5. 备注

-   PPTX 节点做完，PPT Deck Agent 模板就能真正产出可下载 .pptx（之前卡在没生成库）。
-   若某库的 buffer API 与上面示例不符（版本差异），以该库官方文档为准并在 commit 注明。
