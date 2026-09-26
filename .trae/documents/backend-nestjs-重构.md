# 后端重构：Express → NestJS

## 一、Context

`src/backend` 目前用 express 5 + socket.io 手写实现，共 5 个文件：HTTP 层只有 `GET /health` 一个路由加 `public/` 静态目录托管，业务逻辑全部走 9 个 socket.io 事件（ack 回调风格）。

重构动因：统一到 NestJS 的 Module / Provider / Gateway 体系，用依赖注入接管 socket 事件处理与业务对象的装配，替换手写的 `registerTaskHandlers(io, socket)` 注册方式，使后续扩展（新增事件、新增接口）有统一的组织范式。

**设计模式**：Nest 原生的 Module + Provider + Gateway 三段式，本质是「依赖注入容器 + 观察者（事件驱动）」的组合。`@SubscribeMessage` 把「事件名 → 处理函数」的注册表交由框架托管，Gateway 作为单例订阅者持有 `io` 用于广播。相较重构前每个 socket 连接各 `new` 一份 `TaskService`，现在是进程内单例。

**预期结果**：对外行为零变化，前端、CLI 命令、5 个集成测试均无需改逻辑；内部改为 Nest 惯用法。

## 二、对外契约（必须保持不变）

1. 9 个 socket 事件名与响应结构 `{success:true,data}` / `{success:false,error,message?}`，含全部具体中文文案（如 `任务不存在`、`任务名称不能为空`）
2. 广播事件 `task:created` / `task:updated` / `task:deleted` / `task:allDeleted`
3. socket.io 默认路径 `/socket.io`，cors `origin: '*'`、`methods: ['GET','POST']`
4. `GET /health` → `{"status":"ok"}`
5. `public/` 目录托管在根路径
6. 端口默认 3000、host 固定 127.0.0.1、启动后 `exec('start http://...')` 自动打开浏览器，保留两行启动日志
7. 连接 / 断开日志 `客户端已连接: <id>` / `客户端已断开: <id>`

### 唯一必要的偏差

`NestFactory.create()` 是异步的，`createApp()` 与 `startServer()` 无法保持同步签名，必须改为 async。因此有两个调用点各改 1 行（加 `await`），**5 个测试文件本体不改**：

- [websocket.setup.ts](file:///e:/Desktop/taskmgr/test/testbackend/task/websocket.setup.ts#L30) —— `const { httpServer } = await createApp()`
- [ui/index.ts](file:///e:/Desktop/taskmgr/src/commands/ui/index.ts#L20) —— `await startServer(flags.port)`

## 三、技术风险与对策

### R1 esbuild / tsx 不支持 emitDecoratorMetadata（最关键）

`dev:backend` 是 `tsx watch`，mocha 走 `.mocharc.json` 的 `import: tsx`，而 tsx 基于 esbuild —— esbuild 不产出 `design:paramtypes` 元数据。若按标准写法靠类型推导注入，会出现「tsc 构建后能跑、tsx 下报 `Nest can't resolve dependencies`」的最坏情况。

**对策（硬性规则）**：所有 Nest 托管类的**每个构造参数都显式写 `@Inject(类名)`**。Nest 的 `reflectConstructorParams` 会用 `@Inject` 存的 `SELF_DECLARED_DEPS_METADATA` 逐位填充参数类型，不依赖 `design:paramtypes`。同时被注入的类必须**值导入**（`import { TaskService }`），不能用 `import type`。

tsconfig 仍开启 `emitDecoratorMetadata` 作为 tsc 构建路径下的安全网，但代码不得依赖它。

### R2 reflect-metadata 加载时机

装饰器编译产物调用 `Reflect.metadata`，必须在任何装饰器执行前加载。放在 `src/backend/app.ts` 的**第一行** `import 'reflect-metadata'` —— app.ts 是整棵装饰器模块图的根，且测试直连 app.ts（绕过 server.ts），这一行覆盖全部三条入口。

### R3 io 实例只能从 Gateway 取

`IoAdapter` 没有公开的 `io` 字段（Server 存在内部 `SocketsContainer`），从 HttpAdapterHost 取不通。唯一稳妥方式：`app.get(TaskGateway).server`（读 `@WebSocketServer()` 装饰的 **public** 属性），且必须在 `await app.init()` 之后 —— Nest 在 `subscribeToServerEvents()` 中才用 `Reflect.set` 注入该属性。

### R4 无 @Injectable() 的 lib 类

`TaskService` 无构造参数，注册为 provider 无需任何元数据即可实例化。若启动时报 `Nest can't resolve dependencies of the TaskService`，退路是显式工厂 `{ provide: TaskService, useFactory: () => new TaskService() }`，此时 gateway 代码不用改（token 仍是类本身）。

### R5 待实施时实测确认的三点

- tsx 是否透传 tsconfig 的 `experimentalDecorators`。失败退路：`.mocharc.json` 改 `ts-node/esm`、`dev:backend` 改 `node --import ts-node/esm --watch src/backend/server.ts`、同步更新 launch.json。
- TypeScript 5.x 能否解析 Nest 12.1.0 的 `.d.ts`（`skipLibCheck` 只跳类型检查不跳解析）。失败则升 `typescript`。
- mocha 进程能否干净退出。现有 `stopTestServer` 只关 `httpServer`，若 socket.io 残留定时器拖住事件循环，在 app.ts 补一行（**不动测试文件**）：`httpServer.once('close', () => { void app.close().catch(() => {}) })`。

## 四、目标文件结构

`lib` 层与 `db` 层**零改动**。

- `src/backend/server.ts` —— 改：入口路径不变（package.json `start:backend` 与 launch.json 都指向它），内容为 `await startServer()`
- `src/backend/index.ts` —— 改：`export async function startServer(port?: number)`，端口解析 + listen + 自动开浏览器
- `src/backend/app.ts` —— 改：`export async function createApp(): Promise<{ app, httpServer, io }>`
- `src/backend/app.module.ts` —— 新增：`AppModule`
- `src/backend/health.controller.ts` —— 新增：`HealthController`
- `src/backend/websocket/task.gateway.ts` —— 新增：`TaskGateway`，9 个 `@SubscribeMessage` + 连接生命周期
- `src/backend/websocket/index.ts` —— 删除（`setupWebSocketHandlers` 不再需要）
- `src/backend/websocket/task-handler.ts` —— 删除（由 gateway 取代）
- `tsconfig.json` —— 改：加 `experimentalDecorators` / `emitDecoratorMetadata`
- `package.json` —— 改：新增 Nest 依赖，`engines.node` 提到 `>=20`

依赖安装清单：

```
npm i @nestjs/common@^12.1.0 @nestjs/core@^12.1.0 @nestjs/platform-express@^12.1.0 \
      @nestjs/websockets@^12.1.0 @nestjs/platform-socket.io@^12.1.0 \
      reflect-metadata@^0.2.2 rxjs@^7.8.2
```

五个 Nest 包必须同 major（互为 peer 依赖）。`rxjs` 目前只是传递依赖，必须提为直接依赖才能满足 peer。不装 `@nestjs/cli` / `class-validator`（用现有 `validators.ts`），不装 `@nestjs/serve-static`（`useStaticAssets` 足够）。现有 `express` 直接依赖保留不动 —— `@nestjs/platform-express` 自带 express 5.2.1 与现有一致，保留零风险。

## 五、关键实现

### app.ts

```ts
import 'reflect-metadata' // 必须首行：装饰器元数据依赖，先于任何装饰器执行

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import type { Server as HttpServer } from 'node:http'

import { AppModule } from './app.module.js'
import { TaskGateway } from './websocket/task.gateway.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'], // 抑制 Nest 启动噪声，只保留现有简洁日志
  })

  app.useStaticAssets(path.join(__dirname, '../../public')) // 等价于原 express.static

  await app.init() // init 内部才创建 io Server 并注入 @WebSocketServer 属性

  const httpServer = app.getHttpServer() as HttpServer
  const io = app.get(TaskGateway).server

  return { app, httpServer, io }
}
```

### app.module.ts / health.controller.ts

```ts
@Module({
  controllers: [HealthController],
  providers: [TaskService, TaskDeleteHandler, TaskGateway],
})
export class AppModule {}

@Controller()
export class HealthController {
  @Get('health')
  check(): { status: string } {
    return { status: 'ok' }
  }
}
```

`express.json()` 由 Nest 默认 bodyParser 等价保留（挂载顺序从「json → static」变为「static → json」，对静态资源与 `/health` 无影响）。

### task.gateway.ts

```ts
@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] }, // 原样透传给 socket.io 构造函数
})
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server!: Server // public，供 app.ts 取 io

  // 每个构造参数都显式 @Inject：tsx/esbuild 不产出 design:paramtypes
  constructor(
    @Inject(TaskService) private readonly taskService: TaskService,
    @Inject(TaskDeleteHandler) private readonly deleteHandler: TaskDeleteHandler,
  ) {}
  ...
}
```

9 个 handler 的搬移规则（逐行 1:1，不顺手"优化"，因为测试断言了具体文案）：

- `callback(x)` → `return x`（Nest 的 IoAdapter 会把返回值作为 ack 响应）
- `io.emit(...)` → `this.server.emit(...)`
- **绝不 throw** —— Nest 的异常过滤器会吞掉异常，导致 ack 永不返回、客户端挂到超时。保留原有 try/catch，catch 内 `return { success: false, error: 'xx失败', message }`
- 响应对象**不得出现 `event` 字段** —— 有该字段时 Nest 会改走 `socket.emit(response.event, response.data)` 分支而不调用 ack
- 无载荷事件（`task:getAll`、`task:deleteAll`）**不写 `@MessageBody()` 参数**，因为该事件载荷只有 ack 回调
- 裸 number / string 载荷（`task:getById`、`task:delete`、`task:getByName`、`task:deleteByName`）用 `@MessageBody() id: number` 可直接取到原始值
- 不需要 `@ConnectedSocket`，广播统一用 `this.server.emit`
- `handleConnection` / `handleDisconnect` 不加装饰器

`updateTask` / `updateTaskByName` 是普通函数而非类，直接从 `task-update-handler.js` 导入调用，不为它们造 injection token。

## 六、实施步骤

1. **冒烟验证**（放 `testmp/`）：最小 Nest 应用，分别用 `tsx` 与 `tsc` + `node dist/...` 跑通 `@Inject` 构造注入，并确认 tsx 下装饰器按 legacy 语义生效。**此步不通过先按 R5 退路调整，不要继续。**
2. 安装依赖；`package.json` 的 `engines.node` 提到 `>=20`
3. `tsconfig.json` 加两行；单独跑 `npm run typecheck` 确认 CLI 侧无副作用（现有 12 个命令文件无装饰器，编译产物不变）
4. 新建 `app.module.ts` + `health.controller.ts`
5. 新建 `websocket/task.gateway.ts`，逐行搬移 9 个 handler
6. 重写 `app.ts`
7. `index.ts` 改为 async，`server.ts` 改为 `await startServer()`
8. `ui/index.ts` 与 `websocket.setup.ts` 各加 `await`（各 1 行）
9. 删除 `websocket/index.ts` 与 `websocket/task-handler.ts`
10. 跑 `npm run typecheck` → `npm run build` → `npm run lint`，消除全部报错与警告
11. 跑集成测试（见验证方案）
12. 端到端手工验证

## 七、验证方案

### 静态检查与构建

```
npm run typecheck   # 同时校验 test/ 目录，是最有价值的一道防线
npm run build       # build:css + 清 dist + tsc
npm run lint
```

### 现有 5 个集成测试（回归主防线）

```
npm run test:dir    # tsx test/cli/test-cli.ts file --dir test/testbackend
```

观察两点：5 个文件全部通过（断言了 `任务不存在`、`任务名称不能为空` 等文案，以及广播事件）；mocha 进程能干净退出（不能退出则按 R5 处理）。

### 端到端手工验证

```
npm run start:backend   # 生产路径 node dist/backend/server.js
npm run dev:backend     # 开发路径 tsx watch，重点确认 tsx 下同样正常
npm run start -- ui     # oclif 命令路径
```

浏览器自动打开 `http://127.0.0.1:3000` 后逐项确认：

- 静态资源正常加载（`useStaticAssets` 生效、路径未变）
- 任务列表加载成功（`task:getAll` ack 契约正常）
- 切换启用/禁用、删除按钮正常（`task:update` / `task:delete` 与广播正常）
- **开两个浏览器窗口**，一个窗口操作另一个自动刷新（`this.server.emit` 广播触达所有客户端）
- `curl -i http://127.0.0.1:3000/health` → `{"status":"ok"}`
- `curl -i "http://127.0.0.1:3000/socket.io/?EIO=4&transport=polling"` → 返回 `0{"sid":...` 形式内容，证明默认 path 未变
- 控制台仍有 `Server is running on http://127.0.0.1:3000`、`WebSocket server is running on ws://127.0.0.1:3000`、`客户端已连接/已断开`，且无 Nest 启动噪声