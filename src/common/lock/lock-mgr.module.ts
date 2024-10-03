import { Module } from '@nestjs/common';
import { RedisLockManager } from './redis-lock-mgr';
import { MemoryDBModule } from '../../database/redis/redis.module';
@Module({
  imports: [MemoryDBModule],
  providers: [RedisLockManager],
  exports: [RedisLockManager],
})
export class LockModule {}
