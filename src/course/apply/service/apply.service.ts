import { Injectable } from '@nestjs/common';
import { ApplyRepository } from '../repository/apply.repository';
import { CourseApplyHistory } from '../apply.entity';
import { ApplyCourseDto } from '../apply.dto';
import { RedisLockManager } from '../../../common/lock/redis-lock-mgr';
import { LockModule } from 'src/common/lock/lock-mgr.module';
import { RedisRepository } from '../../../database/redis/redis.repository';
import { CourseRepository } from '../../repository/course.repository';
@Injectable()
export class ApplyService {
  constructor(private readonly applyRepository: ApplyRepository, private readonly redisLockManager: RedisLockManager, private readonly redisRepository: RedisRepository, private readonly courseRepository: CourseRepository) {}

  async applyForCourse(applyData: ApplyCourseDto): Promise<CourseApplyHistory> {
    const course = await this.courseRepository.findCourseById(applyData.courseId);
    const max_applies = course.maxParticipants;

    // redis에 신청 인원이 가득 찼는지 확인
    const isFull = await this.checkCourseMaxAppliesCount_from_redis(applyData.courseId, max_applies);
    if(isFull){
      throw new Error('신청 인원이 가득 찼습니다.');
    }

    // Redis에서 이미 신청한 유저인지 확인
    const alreadyApplied = await this.checkAlreadyApplied(applyData.userId, applyData.courseId);
    if (alreadyApplied) {
      throw new Error('이미 신청한 유저입니다. 10초에 한번만 신청할 수 있습니다.');
    }else{
      // 이미 신청한 유저가 아니기 때문에 새로 등록. timeout을 10초로 설정
      await this.redisRepository.set(`user:${applyData.userId}:applied:${applyData.courseId}`, 'true', 10);
    }
    
    // redis-lock
    return this.redisLockManager.withLock(applyData.courseId.toString(), async () => {

      // lock 안에서 신청 인원이 가득 찼는지 다시 확인
      const isFull = await this.checkCourseMaxAppliesCount_from_db(applyData.courseId, max_applies);
      if(isFull){
        throw new Error('신청 인원이 가득 찼습니다.');
      }

      // 신청 인원이 가득 차지 않았다면 신청 처리
      const new_apply = await this.applyRepository.createApply(applyData);

      // redis count 증가
      await this.incrementCourseAppliesCount(applyData.courseId);
      
      return new_apply;
    });
  }

  async getUserApplies(userId: number): Promise<CourseApplyHistory[]> {
    return this.applyRepository.findAppliesByUserId(userId);
  }

  private async checkAlreadyApplied(userId: number, courseId: number): Promise<boolean> {
    const alreadyApplied = await this.redisRepository.get(`user:${userId}:applied:${courseId}`);
    return !!alreadyApplied;
  }

  private async checkCourseMaxAppliesCount_from_db(courseId: number, max_applies: number): Promise<boolean> {

    const appliesCount = await this.applyRepository.findAppliesCountByCourseId(courseId);
    return appliesCount >= max_applies;
  }

  private async checkCourseMaxAppliesCount_from_redis(courseId: number, max_applies: number): Promise<boolean> {
    const appliesCount = await this.redisRepository.get(`course:${courseId}:applies`);
    return Number(appliesCount) >= max_applies;
  }

  private async incrementCourseAppliesCount(courseId: number): Promise<void> {
    await this.redisRepository.increment(`course:${courseId}:applies`);
  }
}
