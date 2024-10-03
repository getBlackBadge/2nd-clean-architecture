import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseController } from './controller/course.controller';
import { CourseService } from './service/course.service';
import { CourseRepository } from './repository/course.repository';
import { Course } from './course.entity';
import { ApplyController } from './apply/controller/apply.controller';
import { ApplyService } from './apply/service/apply.service';
import { ApplyRepository } from './apply/repository/apply.repository';
import { CourseApplyHistory } from './apply/apply.entity';
import { LockModule } from 'src/common/lock/lock-mgr.module';
import { MemoryDBModule } from 'src/database/redis/redis.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseApplyHistory]),
    LockModule,
    MemoryDBModule
  ],
  controllers: [CourseController, ApplyController],
  providers: [CourseService, CourseRepository, ApplyService, ApplyRepository],
  exports: [CourseService, ApplyService],
})
export class CourseModule {}