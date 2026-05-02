#!/usr/bin/env tsx
import { relative } from 'node:path'
import { Command } from 'commander'
import {
  runTests,
  collectTestGroups,
  printTestFiles,
  selectTestFileInteractive,
  selectTestCaseInteractive,
} from './utils.js'

// #region 常量定义
const TEST_DIRS = ['test/testcmd', 'test/testbackend']
// #endregion

// #region 主函数
async function main() {
  const program = new Command()
  
  program
    .name('test-cli')
    .description('测试运行器 - 支持按文件或测试用例运行测试')
    .version('1.0.0')
  
  program
    .command('run')
    .description('交互式选择并运行测试文件')
    .action(async () => {
      console.log('🔍 扫描测试文件...\n')
      
      const testGroups = collectTestGroups(TEST_DIRS)
      
      if (testGroups.length === 0) {
        console.log('❌ 未找到测试文件')
        process.exit(1)
      }
      
      const selectedGroup = await selectTestFileInteractive(testGroups)
      
      if (!selectedGroup) {
        console.log('\n❌ 未选择文件')
        return
      }
      
      console.log(`\n🚀 运行文件: ${relative(process.cwd(), selectedGroup.file)}\n`)
      runTests('', selectedGroup.file)
    })
  
  program
    .command('case')
    .description('交互式选择并运行指定的测试用例')
    .action(async () => {
      console.log('🔍 扫描测试用例...\n')
      
      const testGroups = collectTestGroups(TEST_DIRS)
      
      if (testGroups.length === 0) {
        console.log('❌ 未找到测试文件')
        process.exit(1)
      }
      
      const selectedCase = await selectTestCaseInteractive(testGroups)
      
      if (!selectedCase) {
        console.log('\n❌ 未选择测试用例')
        return
      }
      
      console.log(`\n🚀 运行测试用例: ${selectedCase.fullName}\n`)
      runTests(selectedCase.fullName, selectedCase.file)
    })
  
  program
    .command('list')
    .description('列出所有可用的测试文件和测试用例')
    .action(async () => {
      console.log('🔍 扫描测试文件...\n')
      const testGroups = collectTestGroups(TEST_DIRS)
      
      if (testGroups.length === 0) {
        console.log('❌ 未找到测试文件')
        return
      }
      
      printTestFiles(testGroups)
      
      const selectedGroup = await selectTestFileInteractive(testGroups)
      
      if (!selectedGroup) {
        console.log('\n❌ 未选择文件')
        return
      }
      
      console.log(`\n📄 ${relative(process.cwd(), selectedGroup.file)} 的测试用例:\n`)
      selectedGroup.cases.forEach((c) => {
        console.log(`  - ${c.fullName}`)
      })
    })
  
  // 如果没有提供任何参数，显示帮助信息
  if (process.argv.length === 2) {
    program.help()
  }
  
  await program.parseAsync(process.argv)
}
// #endregion

main().catch((error) => {
  console.error('❌ 发生错误:', error)
  process.exit(1)
})
