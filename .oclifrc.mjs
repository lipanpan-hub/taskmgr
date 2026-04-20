export default {
  bin: 'tm',
  dirname: 'lppxtaskmgr',
  binAliases: ['ttt'],
  commands: './dist/commands',
  hooks: {
    init: './dist/hooks/init',
  },
  plugins: [
    '@oclif/plugin-help',
    '@oclif/plugin-autocomplete',
    '@oclif/plugin-not-found',
    '@oclif/plugin-warn-if-update-available',
    '@oclif/plugin-version',
  ],
  topicSeparator: ' ',
  topics: {
    wtsk: {
      description: '为人类提供的win定时任务管理入口',
    },
    scripts: {
      description: '脚本管理',
    },
  },
  additionalFiles: [
    'node_modules/edge-js/**/*',
    'node_modules/better-sqlite3/**/*',
    'TaskScheduler.2.12.2/**/*',
  ],
};
