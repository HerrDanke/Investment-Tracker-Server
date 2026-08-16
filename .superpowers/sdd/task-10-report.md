# 任务 10 报告：导出/导入 API

**状态：** DONE

**提交 hash：** 416671f

**测试结果：**
- `cargo check` 通过，编译成功，无错误无警告（除了 Git 的 CRLF 警告，不影响功能）

**实现内容：**
- 创建 `src/handlers/export_import.rs`，包含两个端点：
  - `GET /export` — 导出全部数据为 JSON 字符串
  - `POST /import` — 导入 JSON 数据替换当前数据库

**疑虑：**
- 无。代码完全按照任务简报逐字实现，未修改 handlers/mod.rs（按指示）。
- 注意：简报中使用的 `Router<AppState>` 类型签名与 axum 0.6+ 一致；项目依赖已满足。
