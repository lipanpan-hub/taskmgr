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

})
