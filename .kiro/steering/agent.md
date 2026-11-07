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
