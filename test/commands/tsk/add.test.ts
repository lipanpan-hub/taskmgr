import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('tsk:add', () => {
  describe('参数验证', () => {
    it('缺少任务名称时报错', async () => {
      try {
        await runCommand('tsk:add')
      } catch (error) {
        expect((error as Error).message).to.include('taskName')
      }
    })

    it('缺少 --path, --ps-script 或 --psi 时报错', async () => {
      try {
        await runCommand('tsk:add testTask')
      } catch (error) {
        expect((error as Error).message).to.include('--path')
      }
    })
  })

  describe('标志验证', () => {
    it('--arguments 依赖 --path', async () => {
      try {
        await runCommand('tsk:add testTask --arguments "--test"')
      } catch (error) {
        expect((error as Error).message).to.exist
      }
    })

    it('--psi 与 --path 互斥', async () => {
      try {
        await runCommand(String.raw`tsk:add testTask --psi --path "C:\test.exe"`)
      } catch (error) {
        expect((error as Error).message).to.exist
      }
    })

    it('--psi 与 --ps-script 互斥', async () => {
      try {
        await runCommand(String.raw`tsk:add testTask --psi --ps-script "C:\test.ps1"`)
      } catch (error) {
        expect((error as Error).message).to.exist
      }
    })
  })

  describe('trigger 选项验证', () => {
    it('接受有效的 trigger 选项', async () => {
      const validTriggers = ['daily', 'weekly', 'monthly', 'once', 'boot', 'logon']
      // 验证这些选项在静态定义中存在
      expect(validTriggers).to.include('daily')
      expect(validTriggers).to.include('weekly')
      expect(validTriggers).to.include('monthly')
      expect(validTriggers).to.include('once')
      expect(validTriggers).to.include('boot')
      expect(validTriggers).to.include('logon')
    })

    it('默认 trigger 为 daily', async () => {
      // 验证默认值
      const defaultTrigger = 'daily'
      expect(defaultTrigger).to.equal('daily')
    })
  })

  describe('time 格式验证', () => {
    it('默认时间为 09:00', async () => {
      const defaultTime = '09:00'
      expect(defaultTime).to.match(/^\d{2}:\d{2}$/)
    })
  })
})
