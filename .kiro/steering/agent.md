---
inclusion: always
---

# Agent 经验总结



## oclif 命令继承相关

### 抽象基类的 static args 在子类 this.parse() 时丢失
**问题**: `BaseCreateCommand`（`src/lib/task/base-create-command.ts`）把 `static args` 放在基类，子类 `this.parse()` 报 `Unexpected argument`。原因是 oclif 对类做 `{...this.ctor}` 展开，只复制子类自身的静态属性。基类的 `run()` 里已改为显式传 `args`、`baseFlags`、`flags`。新增子命令直接继承 `BaseCreateCommand` 即可，只需声明 `static flags`、`description`、`examples` 和 `triggerType`。

**记录时间**: 2026-11-07

## 改动命令前先检查测试依赖

### 删除/收窄命令 flag 前，必须 grep `test/` 目录里的调用
**问题**: 瘦身 `task create` 的 `index.ts` 前，只检查了 src、docs、README，漏掉了 `test/testcmd/commands/task/create/` 下 7 个测试文件（约 50 处 `--trigger=` 旧写法调用）。这些测试通过 `runCommand` 真实调用命令，并且会在 Windows 任务计划程序里真实创建任务。
**注意**: 这批测试用固定任务名（如 `testTask2`），同一批测试连续跑两次会报 `UNIQUE constraint failed`，需先 `tm task delete <名称> --force` 清理。子命令的 `monthly` 默认 `--months` 为全年，`weekdays` 的 `dependsOn` 方向与旧 index 相反，错误信息也不同。

**记录时间**: 2026-11-07

## 排查"定时任务不重复执行"

### 重新注册任务会中断 logon/boot/事件类触发器正在进行的重复计划
**现象**: `tm task create logon/boot --repeat-interval=5` 的任务登录后只跑一次，`NextRunTime` 为空。XML 里 `<Repetition>` 正确，代码没有 bug。
**根因（已实测）**: 项目自带的 `\taskmgr\AutoSync` 是登录触发的任务，执行 `tm task sync2schd`，会对数据库里的每个任务调用 `RegisterTaskDefinition` 覆盖重注册。登录后约 18 秒，用户任务的重复计划就被这次重注册中断。
**实验**: 用事件触发器（可手动触发）+ 每 1 分钟重复做对照。触发后每分钟正常重复；原样重新注册后，不再运行。登录/开机触发器无法手动触发，所以用事件触发器类比，最终仍需注销重登验证。
**注意**: `Get-ScheduledTaskInfo` 的 `NextRunTime` 对登录/开机/事件触发器的重复本来就是空，不能用它判断重复是否在工作，要看 `LastRunTime` 是否持续更新。
**排查要点**: 用 `task:sync2schd` 和 `task:create` 的日志时间对比 `LastRunTime` 与 XML 里 `<RegistrationInfo><Date>`；若注册时间晚于最后一次运行，说明被重新注册过。`tm task list` 显示的触发类型可能与用户口述（"开机"）不同。任务计划程序历史记录默认关闭，无法用事件日志核对。

**记录时间**: 2026-11-07
### 修复与发布注意
**修复**: `tm task sync2schd` 新增 `--only-missing`（已存在的任务跳过），`src/lib/wtsk/autosync.ts` 生成的启动器改为 `tm task sync2schd --only-missing`。
**坑**: 全局安装的 `tm`（`@lppx/taskmgr`，在 nvm 目录下的 `tm.exe`）与源码是两份。init 钩子每次运行 tm 都会重写 `autosync-launcher.vbs`，旧版 tm 会把它写回不带 `--only-missing` 的命令，且旧版不认识该参数。本地用 `node bin/dev.js ...` 验证；生效前必须发布并升级全局 tm，之后启动器才会稳定带上新参数。
