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
      try {
        await runCommand(String.raw`tsk:add testTask --path "C:\test.exe" --trigger daily`)
      } catch (error) {
        expect((error as Error).message).to.not.include('trigger')
      }
    })

    it('拒绝无效的 trigger 选项', async () => {
      try {
        await runCommand(String.raw`tsk:add testTask --path "C:\test.exe" --trigger invalid`)
      } catch (error) {
        expect((error as Error).message).to.include('Expected --trigger=invalid')
      }
    })
  })

  describe('time 格式验证', () => {
    it('接受有效的 time 格式', async () => {
      try {
        await runCommand(String.raw`tsk:add testTask --path "C:\test.exe" --time "14:30"`)
      } catch (error) {
        expect((error as Error).message).to.not.include('time')
      }
    })
  })
})
