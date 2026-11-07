---
inclusion: always
---

# Agent 经验总结



## oclif 命令继承相关

### 抽象基类的 static args 在子类 this.parse() 时丢失
**问题**: `BaseCreateCommand`（`src/lib/task/base-create-command.ts`）把 `static args` 放在基类，子类 `this.parse()` 报 `Unexpected argument`。原因是 oclif 对类做 `{...this.ctor}` 展开，只复制子类自身的静态属性。基类的 `run()` 里已改为显式传 `args`、`baseFlags`、`flags`。新增子命令直接继承 `BaseCreateCommand` 即可，只需声明 `static flags`、`description`、`examples` 和 `triggerType`。

**记录时间**: 2026-11-07
