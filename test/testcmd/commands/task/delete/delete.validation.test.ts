import {expect} from 'chai'
import {runCommand} from '../../../test-helper.js'

describe('task delete - 参数验证', () => {
  it('缺少任务名称、ID 和 interactive 标志时报错', async () => {
    const result = await runCommand(['task', 'delete'])
    expect(result.error?.message).to.include('必须提供任务名称、使用 --id 指定ID、使用 --all 删除所有任务，或使用 --interactive 交互式选择')
  })

  it('使用不存在的任务名称时报错', async () => {
    const result = await runCommand(['task', 'delete', 'nonexistent-task-name-12345', '--force'])
    expect(result.error?.message).to.include('任务不存在')
  })

  it('使用不存在的任务ID时报错', async () => {
    const result = await runCommand(['task', 'delete', '--id=999999', '--force'])
    expect(result.error?.message).to.include('任务不存在')
  })
})
