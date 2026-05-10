import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execSync } from 'node:child_process'
import prompts from 'prompts'
import Fuse from 'fuse.js'

// #region 类型定义
export interface TestCase {
  it: string
  file: string
}

export interface TestGroup {
  file: string
  cases: TestCase[]
}
// #endregion

// #region 测试文件扫描与解析
export function scanTestFiles(dir: string): string[] {
  // 递归扫描目录下所有 .test.ts 文件
  const files: string[] = []
  
  try {
    const entries = readdirSync(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        files.push(...scanTestFiles(fullPath)) // 递归扫描子目录
      } else if (entry.endsWith('.test.ts')) {
        files.push(fullPath) // 收集所有 .test.ts结尾的测试文件
      }
    }
  } catch (error) {
    console.error(`扫描目录失败: ${dir}`, error)
  }
  
  return files
}

export function parseTestFile(filePath: string): TestCase[] {
  // 解析测试文件中的 it 用例
  const cases: TestCase[] = []
  
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // 匹配 it('测试名称') 格式，支持单引号、双引号、反引号
      const itMatch = line.match(/it\s*\(\s*['"`]([^'"`]+)['"`]/)
      if (itMatch) {
        const itName = itMatch[1]
        
        cases.push({
          it: itName,
          file: filePath,
        })
      }
    }
  } catch (error) {
    console.error(`解析文件失败: ${filePath}`, error)
  }
  
  return cases
}

export function collectTestGroups(testDirs: string[]): TestGroup[] {
  // 收集所有测试目录中的测试文件和用例
  
  // 步骤1: 扫描所有测试目录，收集测试文件路径
  const allFiles: string[] = []
  for (const dir of testDirs) {
    const files = scanTestFiles(dir)
    allFiles.push(...files)
  }
  
  if (allFiles.length === 0) {
    return []
  }
  
  // 步骤2: 解析每个测试文件，提取测试用例并分组
  const testGroups: TestGroup[] = []
  for (const file of allFiles) {
    const cases = parseTestFile(file)
    if (cases.length > 0) {
      testGroups.push({ file, cases })
    }
  }
  
  return testGroups
}

export function findTestFile(path: string, testGroups: TestGroup[]): TestGroup | undefined {
  // 根据路径查找对应的测试文件组
  return testGroups.find((g) => g.file === path || g.file.endsWith(path))
}
// #endregion



// #region 测试执行与输出
export function runTests(grepPattern: string, specificFile?: string) {
  // 执行测试命令，支持 grep 过滤和指定文件
  // grepPattern 应该是 it 测试用例的名称，而不是完整的 describe > it 路径
  try {
    // 步骤1: 构建基础命令（指定文件时直接用 mocha，否则用 npm script）
    let command = 'npm run mocha:test'
    
    if (specificFile) {
      command = `mocha "${specificFile}"`
    }
    
    // 步骤2: 添加 grep 过滤器（转义正则特殊字符，避免注入风险）
    if (grepPattern) {
      const escapedPattern = grepPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      command += ` --grep "${escapedPattern}"`
    }
    
    console.log(`执行命令: ${command}\n`)
    
    // 步骤3: 执行测试命令，输出直接显示在终端
    execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    
    console.log('\n✅ 测试完成')
  } catch (error) {
    console.error('\n❌ 测试失败')
    process.exit(1)
  }
}

export function printTestFiles(testGroups: TestGroup[]) {
  // 打印所有测试文件列表
  console.log(`📁 测试文件 (${testGroups.length} 个):\n`)
  testGroups.forEach((group) => {
    console.log(`  ${relative(process.cwd(), group.file)} (${group.cases.length} 个用例)`)
  })
}

export function printTestCases(testGroups: TestGroup[]) {
  // 打印所有测试用例详细列表
  const totalCases = testGroups.reduce((sum, g) => sum + g.cases.length, 0)
  console.log(`\n🔍 测试用例 (${totalCases} 个):\n`)
  
  testGroups.forEach((group) => {
    console.log(`\n  📄 ${relative(process.cwd(), group.file)}`)
    group.cases.forEach((c) => {
      console.log(`    - ${c.it}`)
    })
  })
}

export async function selectTestFileInteractive(testGroups: TestGroup[]): Promise<TestGroup | null> {
  // 使用 prompts + fuse.js 让用户交互式选择测试文件
  
  // 步骤1: 构建选项列表（显示相对路径和用例数量）
  const fileChoices = testGroups.map((group) => ({
    title: `${relative(process.cwd(), group.file)} (${group.cases.length} 个用例)`,
    value: group,
  }))
  
  // 步骤2: 初始化 Fuse.js 模糊搜索引擎
  const fuse = new Fuse(fileChoices, {
    keys: ['title'],
    threshold: 0.4, // 模糊匹配阈值，0.4 表示中等宽松度
  })
  
  // 步骤3: 显示交互式选择器，支持模糊搜索
  const response = await prompts({
    type: 'autocomplete',
    name: 'file',
    message: '选择要查看的测试文件',
    choices: fileChoices,
    suggest: async (input: string, choices: any[]) => {
      if (!input) return choices // 无输入时显示全部选项
      const results = fuse.search(input) // 使用 Fuse.js 进行模糊搜索
      return results.map((r) => r.item)
    },
  })
  
  if (!response.file) {
    return null // 用户取消选择
  }
  
  return response.file
}

export async function selectTestCaseInteractive(testGroups: TestGroup[]): Promise<TestCase | null> {
  // 使用 prompts + fuse.js 让用户交互式选择测试用例
  
  // 步骤1: 收集所有测试用例
  const allCases: TestCase[] = []
  for (const group of testGroups) {
    allCases.push(...group.cases)
  }
  
  if (allCases.length === 0) {
    return null
  }
  
  // 步骤2: 构建选项列表（显示用例名称和所属文件）
  const caseChoices = allCases.map((testCase) => ({
    title: `${testCase.it} (${relative(process.cwd(), testCase.file)})`,
    value: testCase,
  }))
  
  // 步骤3: 初始化 Fuse.js 模糊搜索引擎
  const fuse = new Fuse(caseChoices, {
    keys: ['title'],
    threshold: 0.4, // 模糊匹配阈值，0.4 表示中等宽松度
  })
  
  // 步骤4: 显示交互式选择器，支持模糊搜索
  const response = await prompts({
    type: 'autocomplete',
    name: 'testCase',
    message: '选择要运行的测试用例',
    choices: caseChoices,
    suggest: async (input: string, choices: any[]) => {
      if (!input) return choices // 无输入时显示全部选项
      const results = fuse.search(input) // 使用 Fuse.js 进行模糊搜索
      return results.map((r) => r.item)
    },
  })
  
  if (!response.testCase) {
    return null // 用户取消选择
  }
  
  return response.testCase
}
// #endregion
