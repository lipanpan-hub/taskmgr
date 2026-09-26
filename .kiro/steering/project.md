# 项目经验

## 脚本目录与模板覆盖

- 脚本目录为 `this.config.configDir/scripts`（即 `%LOCALAPPDATA%\lppxtaskmgr\scripts`）
- `src/hooks/init.ts` 每次执行 tm 都会把项目根目录 `Templates/` 下的文件强制复制到脚本目录，同名文件会被覆盖。编写 SKILL 或文档时要提醒不要使用模板文件名
- `tm scripts add` 用 `copyFileSync` 复制单个文件，同名静默覆盖；输出 `保存位置: <绝对路径>` 可直接用于 `tm task create --arguments`
- 任务创建时不设置 WorkingDirectory，脚本运行时的当前目录不是脚本所在目录

**记录时间**: 2026-09-26
