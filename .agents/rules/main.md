---
trigger: always_on
---


这是一个 windows 系统下的定时任务管理器
这个工具管理 windows 系统下/taskmgr 目录中的定时任务

技术栈:
用oclif 构建CLI客户端
用 edge-js 调用 TaskScheduler 的 dll 执行底层的定时任务管理操作
CLI工具中的问答库 使用 prompts 库, 配合 fuse.js 实现问答时的自动补全



项目根目录下的 public 文件夹用来放置前端代码
项目根目录下的 src/backend 文件夹用来放置后端代码
项目根目录下的 src/commands 文件夹用来放置CLI命令代码
项目根目录下的 src/hooks 文件夹用来放置初始化钩子函数
项目根目录下的 src/lib 文件夹用来放置库函数

