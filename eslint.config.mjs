import {includeIgnoreFile} from '@eslint/compat'
import oclif from 'eslint-config-oclif'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const gitignorePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')

export default [
  includeIgnoreFile(gitignorePath),
  ...oclif,
  prettier,
  {
    // 关闭对本 CLI 项目审查无实际收益的纯风格/主观偏好规则
    rules: {
      // 代码风格排版/注释格式：不影响正确性
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/padding-line-between-statements': 'off',
      '@stylistic/spaced-comment': 'off',
      // 命令入口分支多、构造函数注入依赖多，阈值主观
      'complexity': 'off',
      'max-params': 'off',
      // @remarks 是标准 TSDoc 标签，jsdoc 插件按 JSDoc 规则误报
      'jsdoc/check-tag-names': 'off',
      // 参数使用内联对象类型说明即可，无需为每个子属性单独写 @param
      'jsdoc/check-param-names': ['warn', {checkDestructured: false}],
      // CLI 环境已支持 fetch，属误报
      'n/no-unsupported-features/node-builtins': 'off',
      // 串行调用云 API 是合理的，避免并发限流
      'no-await-in-loop': 'off',
      'object-shorthand': 'off',
      // 成员/导入/对象键/接口排序：纯主观，无功能意义
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-union-types': 'off',
      'prefer-destructuring': 'off',
      // unicorn 系列写法偏好：三元/at/replaceAll/for-of/索引判断/转义大小写等
      'unicorn/consistent-existence-index-check': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/escape-case': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-negated-condition': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/prefer-ternary': 'off',
    },
  },
  {
    // NestJS 装饰器（@Module/@Inject/@SubscribeMessage 等）本质是大写字母开头的函数调用，
    // 会被 new-cap 误判为「大写函数当普通函数调用」，故仅在后端目录关闭该规则
    files: ['src/backend/**/*.ts'],
    rules: {
      'new-cap': 'off',
    },
  },
  {
    // 浏览器端脚本：注入浏览器全局变量
    files: ['public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        io: 'readonly', // socket.io 由 index.html 的 <script> 全局引入
      },
    },
    rules: {
      'no-alert': 'off', // 简单前端交互场景使用原生 confirm 即可
    },
  },
  {
    // CommonJS 配置文件（如 tailwind.config.cjs）：使用 Node/CommonJS 全局变量
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {...globals.node},
      sourceType: 'commonjs',
    },
  },
]
