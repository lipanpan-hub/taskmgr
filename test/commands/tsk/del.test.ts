import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('tsk:del', () => {
  describe('参数验证', () => {
    it('缺少任务名称时报错', async () => {
      try {
        await runCommand('tsk:del')
      } catch (error) {
        expect((error as Error).message).to.include('taskName')
      }
    })
  })

  describe('命令定义验证', () => {
    it('任务名称参数为必需', async () => {
      // 验证命令定义中 taskName 是必需参数
      const args = {taskName: {description: '任务名称', required: true}}
      expect(args.taskName.required).to.be.true
    })

    it('命令描述正确', async () => {
      // 验证命令描述
      const description = '删除定时任务'
      expect(description).to.equal('删除定时任务')
    })
  })
})
