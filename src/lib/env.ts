// 环境变量配置模块 - 负责加载和管理应用程序的环境配置
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

// 获取当前模块的文件路径(ESM模块需要通过import.meta.url转换)
const __filename = fileURLToPath(import.meta.url)
// 获取当前模块所在目录
const __dirname = dirname(__filename)
// 计算项目根目录路径(当前文件在src/lib下,需要向上两级)
const projectRoot = join(__dirname, '../..')



// 从.env文件中读取环境变量并解析为键值对对象
function loadEnv(): Record<string, string> {
  const envPath = join(projectRoot, '.env')
  const env: Record<string, string> = {}

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')

    // 逐行解析.env文件内容
    content.split('\n').forEach(line => {
      line = line.trim()
      
      if (line && !line.startsWith('#')) {         // 跳过空行和注释行(以#开头)
        const [key, ...values] = line.split('=')   // 按等号分割,支持值中包含等号的情况
        if (key) {
          env[key.trim()] = values.join('=').trim()  // 将键和值都去除首尾空格后存入对象
        }
      }
    })
  }

  return env
}

const env = loadEnv()

// 导出应用配置对象,提供默认值以确保应用正常运行
export const envConfig = {
  dbName: env.DB_NAME || 'taskmgr_v1.db', // 数据库文件名,默认为taskmgr_v1.db
}
