import {Flags} from '@oclif/core'
import prompts from 'prompts'
import type {NewTask} from '../../db/schema.js'

const ADVANCED_HELP_GROUP = '高级选项'
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
const MULTIPLE_INSTANCES_OPTIONS = ['ignore-new', 'parallel', 'queue', 'stop-existing'] as const

// #region 命令行高级选项
// 所有 `task create <触发类型>` 子命令共用这一组 flag（见 BaseCreateCommand.baseFlags）
export const advancedFlags = {
  'start-when-available': Flags.boolean({
    description: '错过启动时间后补运行',
    helpGroup: ADVANCED_HELP_GROUP,
  }),
  hidden: Flags.boolean({
    description: '隐藏任务',
    helpGroup: ADVANCED_HELP_GROUP,
  }),
  'wake-to-run': Flags.boolean({
    allowNo: true,
    default: true,
    description: '唤醒电脑运行任务 (使用 --no-wake-to-run 关闭)',
    helpGroup: ADVANCED_HELP_GROUP,
  }),
  'disallow-start-on-batteries': Flags.boolean({
    description: '使用电池供电时不启动任务',
    helpGroup: ADVANCED_HELP_GROUP,
  }),
  'stop-on-batteries': Flags.boolean({
    description: '切换到电池供电时停止任务',
    helpGroup: ADVANCED_HELP_GROUP,
  }),
  'run-highest': Flags.boolean({
    description: '以最高权限运行 (需要在管理员终端中创建)',
    helpGroup: ADVANCED_HELP_GROUP,
  }),
  'multiple-instances': Flags.string({
    description: '任务已在运行时再次触发的处理策略 (默认 ignore-new)',
    helpGroup: ADVANCED_HELP_GROUP,
    options: [...MULTIPLE_INSTANCES_OPTIONS],
  }),
  'time-limit': Flags.integer({
    description: '执行时限(分钟)，0 表示不限制 (系统默认 72 小时)',
    helpGroup: ADVANCED_HELP_GROUP,
    min: 0,
  }),
  'end-time': Flags.string({
    description: '触发器过期时间，到期后不再触发 (YYYY-MM-DD HH:mm)',
    helpGroup: ADVANCED_HELP_GROUP,
    parse: async (input: string) => {
      if (!DATE_TIME_PATTERN.test(input)) {
        throw new Error('end-time 格式必须为 YYYY-MM-DD HH:mm')
      }

      return input
    },
  }),
  'repeat-interval': Flags.integer({
    description: '触发后每隔 N 分钟重复执行',
    helpGroup: ADVANCED_HELP_GROUP,
    min: 1,
  }),
  'repeat-duration': Flags.integer({
    dependsOn: ['repeat-interval'],
    description: '重复执行持续 N 分钟 (缺省表示无限期)',
    helpGroup: ADVANCED_HELP_GROUP,
    min: 1,
  }),
  delay: Flags.integer({
    description: '延迟(分钟)。boot/logon: 触发后延迟执行；其余触发类型: 在开始时间后随机延迟 0~N 分钟',
    helpGroup: ADVANCED_HELP_GROUP,
    min: 1,
  }),
}

// 与 advancedFlags 一一对应的取值（未传入的 flag 为 undefined）
export interface AdvancedFlagValues {
  'start-when-available'?: boolean
  hidden?: boolean
  'wake-to-run'?: boolean
  'disallow-start-on-batteries'?: boolean
  'stop-on-batteries'?: boolean
  'run-highest'?: boolean
  'multiple-instances'?: string
  'time-limit'?: number
  'end-time'?: string
  'repeat-interval'?: number
  'repeat-duration'?: number
  delay?: number
}

// 把 flag 取值转换为 tasks 表字段；start-when-available 属于触发器表，不在此处理
export function advancedFlagsToTaskFields(flags: AdvancedFlagValues): Partial<NewTask> {
  return {
    hidden: flags.hidden,
    wakeToRun: flags['wake-to-run'],
    disallowStartIfOnBatteries: flags['disallow-start-on-batteries'],
    stopIfGoingOnBatteries: flags['stop-on-batteries'],
    runHighest: flags['run-highest'],
    multipleInstances: flags['multiple-instances'] as NewTask['multipleInstances'],
    executionTimeLimitMinutes: flags['time-limit'],
    endTime: flags['end-time'],
    repeatIntervalMinutes: flags['repeat-interval'],
    repeatDurationMinutes: flags['repeat-duration'],
    delayMinutes: flags.delay,
  }
}
// #endregion

// #region update 专用的高级选项
// 与 create 的区别：1.没有默认值（未传入 = 保持原值） 2.布尔项支持 --no-xxx 以便改回 false
// 3.可清除的项传空字符串清除（取值 null）；repeat-interval/repeat-duration/delay 传 0 同样清除
// time-limit 的 0 表示"不限制"，所以只能用空字符串清除（恢复系统默认）
function optionalIntegerUpdateFlag(options: {description: string; isZeroClear: boolean; minValue: number}) {
  return Flags.custom<null | number>({
    description: options.description,
    helpGroup: ADVANCED_HELP_GROUP,
    parse: async (input: string) => {
      const trimmed = input.trim()
      if (trimmed === '') return null
      if (!/^\d+$/.test(trimmed)) throw new Error('必须是整数，传空字符串表示清除')

      const parsedValue = Number(trimmed)
      if (options.isZeroClear && (parsedValue === 0)) return null
      if (parsedValue < options.minValue) throw new Error(`不能小于 ${options.minValue}`)
      return parsedValue
    },
  })()
}

function booleanUpdateFlag(description: string) {
  return Flags.boolean({allowNo: true, description, helpGroup: ADVANCED_HELP_GROUP})
}

export const advancedUpdateFlags = {
  'start-when-available': booleanUpdateFlag('错过启动时间后补运行 (--no-start-when-available 关闭)'),
  hidden: booleanUpdateFlag('隐藏任务 (--no-hidden 取消)'),
  'wake-to-run': booleanUpdateFlag('唤醒电脑运行任务 (--no-wake-to-run 关闭)'),
  'disallow-start-on-batteries': booleanUpdateFlag('使用电池供电时不启动任务 (--no-disallow-start-on-batteries 取消)'),
  'stop-on-batteries': booleanUpdateFlag('切换到电池供电时停止任务 (--no-stop-on-batteries 取消)'),
  'run-highest': booleanUpdateFlag('以最高权限运行 (--no-run-highest 取消)'),
  'multiple-instances': advancedFlags['multiple-instances'],
  'time-limit': optionalIntegerUpdateFlag({
    description: '执行时限(分钟)，0 表示不限制；传空字符串(--time-limit=)恢复系统默认',
    isZeroClear: false,
    minValue: 0,
  }),
  'end-time': Flags.custom<null | string>({
    description: '触发器过期时间 (YYYY-MM-DD HH:mm)；传空字符串(--end-time=)清除',
    helpGroup: ADVANCED_HELP_GROUP,
    parse: async (input: string) => {
      const trimmed = input.trim()
      if (trimmed === '') return null
      if (!DATE_TIME_PATTERN.test(trimmed)) throw new Error('end-time 格式必须为 YYYY-MM-DD HH:mm')
      return trimmed
    },
  })(),
  'repeat-interval': optionalIntegerUpdateFlag({
    description: '触发后每隔 N 分钟重复执行；传 0 或空字符串清除',
    isZeroClear: true,
    minValue: 1,
  }),
  'repeat-duration': optionalIntegerUpdateFlag({
    description: '重复执行持续 N 分钟；传 0 或空字符串清除(无限期)',
    isZeroClear: true,
    minValue: 1,
  }),
  delay: optionalIntegerUpdateFlag({
    description: '延迟(分钟)；传 0 或空字符串清除',
    isZeroClear: true,
    minValue: 1,
  }),
}

// 与 advancedUpdateFlags 一一对应的取值（undefined = 未传入，null = 清除）
export interface AdvancedUpdateFlagValues {
  'start-when-available'?: boolean
  hidden?: boolean
  'wake-to-run'?: boolean
  'disallow-start-on-batteries'?: boolean
  'stop-on-batteries'?: boolean
  'run-highest'?: boolean
  'multiple-instances'?: string
  'time-limit'?: null | number
  'end-time'?: null | string
  'repeat-interval'?: null | number
  'repeat-duration'?: null | number
  delay?: null | number
}

// 转换为 tasks 表字段；undefined 的字段在 drizzle 的 set() 中会被忽略，null 会写入 NULL
export function advancedUpdateFlagsToTaskFields(flags: AdvancedUpdateFlagValues): Partial<NewTask> {
  return {
    hidden: flags.hidden,
    wakeToRun: flags['wake-to-run'],
    disallowStartIfOnBatteries: flags['disallow-start-on-batteries'],
    stopIfGoingOnBatteries: flags['stop-on-batteries'],
    runHighest: flags['run-highest'],
    multipleInstances: flags['multiple-instances'] as NewTask['multipleInstances'],
    executionTimeLimitMinutes: flags['time-limit'],
    endTime: flags['end-time'],
    repeatIntervalMinutes: flags['repeat-interval'],
    repeatDurationMinutes: flags['repeat-duration'],
    delayMinutes: flags.delay,
  }
}
// #endregion

// #region 交互式高级选项
// 留空表示不设置
function validateOptionalInteger(minValue: number) {
  return (value: string) => {
    const trimmed = value.trim()
    if (trimmed === '') return true
    return (/^\d+$/.test(trimmed) && (Number(trimmed) >= minValue)) || `请输入不小于 ${minValue} 的整数，留空表示不设置`
  }
}

function toOptionalInteger(value: string | undefined): number | undefined {
  const trimmed = (value ?? '').trim()
  return (trimmed === '') ? undefined : Number.parseInt(trimmed, 10)
}

export async function promptAdvancedOptions(triggerType: string): Promise<Partial<NewTask>> {
  const onCancel = () => {
    throw new Error('操作已取消')
  }

  const {isConfigure} = await prompts(
    {
      type: 'toggle',
      name: 'isConfigure',
      message: '是否配置高级选项（隐藏、电池策略、重复、过期时间等）',
      initial: false,
      active: '是',
      inactive: '否',
    },
    {onCancel},
  )

  if (!isConfigure) return {}

  const isBootOrLogon = ['boot', 'logon'].includes(triggerType)
  const answers = await prompts(
    [
      {type: 'toggle', name: 'hidden', message: '隐藏任务', initial: false, active: '是', inactive: '否'},
      {type: 'toggle', name: 'wakeToRun', message: '唤醒电脑运行任务', initial: true, active: '是', inactive: '否'},
      {type: 'toggle', name: 'disallowStartIfOnBatteries', message: '使用电池供电时不启动任务', initial: false, active: '是', inactive: '否'},
      {type: 'toggle', name: 'stopIfGoingOnBatteries', message: '切换到电池供电时停止任务', initial: false, active: '是', inactive: '否'},
      {type: 'toggle', name: 'runHighest', message: '以最高权限运行（需要管理员终端）', initial: false, active: '是', inactive: '否'},
      {
        type: 'select',
        name: 'multipleInstances',
        message: '任务已在运行时再次触发',
        choices: [
          {title: '不启动新实例', value: 'ignore-new'},
          {title: '并行运行新实例', value: 'parallel'},
          {title: '排队等待', value: 'queue'},
          {title: '停止现有实例', value: 'stop-existing'},
        ],
        initial: 0,
      },
      {type: 'text', name: 'timeLimit', message: '执行时限(分钟)，0 表示不限制，留空使用系统默认', validate: validateOptionalInteger(0)},
      {
        type: 'text',
        name: 'endTime',
        message: '触发器过期时间 (YYYY-MM-DD HH:mm)，留空表示不过期',
        validate: (value: string) => (value.trim() === '') || DATE_TIME_PATTERN.test(value.trim()) || '请输入有效的时间格式 (YYYY-MM-DD HH:mm)',
      },
      {type: 'text', name: 'repeatInterval', message: '重复间隔(分钟)，留空表示不重复', validate: validateOptionalInteger(1)},
      {
        type: (_prev: unknown, values: {repeatInterval?: string}) => ((values.repeatInterval ?? '').trim() === '' ? null : 'text'),
        name: 'repeatDuration',
        message: '重复持续时间(分钟)，留空表示无限期',
        validate: validateOptionalInteger(1),
      },
      {
        type: 'text',
        name: 'delay',
        message: isBootOrLogon ? '触发后延迟执行(分钟)，留空表示不延迟' : '开始时间后随机延迟的上限(分钟)，留空表示不延迟',
        validate: validateOptionalInteger(1),
      },
    ],
    {onCancel},
  )

  return {
    hidden: answers.hidden,
    wakeToRun: answers.wakeToRun,
    disallowStartIfOnBatteries: answers.disallowStartIfOnBatteries,
    stopIfGoingOnBatteries: answers.stopIfGoingOnBatteries,
    runHighest: answers.runHighest,
    multipleInstances: answers.multipleInstances,
    executionTimeLimitMinutes: toOptionalInteger(answers.timeLimit),
    endTime: (answers.endTime ?? '').trim() || undefined,
    repeatIntervalMinutes: toOptionalInteger(answers.repeatInterval),
    repeatDurationMinutes: toOptionalInteger(answers.repeatDuration),
    delayMinutes: toOptionalInteger(answers.delay),
  }
}
// #endregion
