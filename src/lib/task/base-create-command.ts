import {Args, Flags} from '@oclif/core'
import type {NewTask} from '../../db/schema.js'
import {BaseCommand} from '../base-command.js'
import {advancedFlags} from './advanced-options.js'
import {directCreateTask, interactiveCreateTask} from './task-creator-handler.js'
import type {DirectCreateFlags} from './trigger-creator.js'

// 模板方法模式：创建流程（解析参数 -> 建任务 -> 建触发器 -> 同步到任务计划程序 -> 失败回滚）在
// directCreateTask 中固定不变，各触发类型子命令只负责声明自己的触发器 flag 和 triggerType
export abstract class BaseCreateCommand extends BaseCommand {
  static args = {
    // name、path 以及子命令的触发器 flag 不在 oclif 层标记 required（-i 模式下不需要），
    // 直接创建模式缺失时由 directCreateTask / createTriggerDirect 报错
    name: Args.string({description: '任务名称'}),
  }

  // 所有触发类型共用的 flag，子命令的 static flags 会与之合并
  static baseFlags = {
    interactive: Flags.boolean({char: 'i', description: '交互式创建任务（触发类型已由子命令确定，不再询问）'}),
    path: Flags.string({description: '可执行文件路径'}),
    arguments: Flags.string({description: '执行参数'}),
    description: Flags.string({description: '任务描述'}),
    enabled: Flags.boolean({
      allowNo: true,
      default: true,
      description: '是否启用任务',
    }),
    ...advancedFlags,
  }

  // 子命令声明自己的触发类型
  protected abstract readonly triggerType: NewTask['triggerType']

  async run(): Promise<void> {
    // 不能直接用 this.parse()：oclif 内部用 {...this.ctor} 展开类，只会复制子类自身的静态属性，
    // 继承自基类的 static args 会丢失，导致 "Unexpected argument"，所以显式传入
    const subclass = this.constructor as typeof BaseCreateCommand
    const {args, flags} = await this.parse({
      args: BaseCreateCommand.args,
      baseFlags: BaseCreateCommand.baseFlags,
      flags: subclass.flags,
    })

    if (flags.interactive) {
      await interactiveCreateTask(this.triggerType)
      return
    }

    await directCreateTask(args.name, {
      ...(flags as DirectCreateFlags),
      trigger: this.triggerType,
    })
  }
}
