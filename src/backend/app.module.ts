import { Module } from '@nestjs/common'

import { TaskDeleteHandler } from '../lib/task/task-delete-handler.js'
import { TaskService } from '../lib/task/task-service.js'
import { HealthController } from './health.controller.js'
import { TaskGateway } from './websocket/task.gateway.js'

@Module({
  controllers: [HealthController],
  providers: [TaskService, TaskDeleteHandler, TaskGateway],
})
export class AppModule {}