import { Test, TestingModule } from '@nestjs/testing';
import { ApplyService } from './apply.service';
import { ApplyRepository } from '../repository/apply.repository';
import { CourseRepository } from '../../repository/course.repository';
import { RedisLockManager } from '../../../common/lock/redis-lock-mgr';
import { RedisRepository } from '../../../database/redis/redis.repository';
import { CourseApplyHistory } from '../apply.entity';
import { ApplyCourseDto } from '../apply.dto';

describe('ApplyService', () => {
  let applyService: ApplyService;
  let applyRepository: ApplyRepository;
  let courseRepository: CourseRepository;
  let redisLockManager: RedisLockManager;
  let redisRepository: RedisRepository;

  const mockCourse = { id: 1, maxParticipants: 3 };
  const mockApplyData: ApplyCourseDto = { userId: 1, courseId: 1 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplyService,
        {
          provide: ApplyRepository,
          useValue: {
            createApply: jest.fn().mockResolvedValue(new CourseApplyHistory()),
            findAppliesCountByCourseId: jest.fn().mockResolvedValue(1),
          },
        },
        {
          provide: CourseRepository,
          useValue: {
            findCourseById: jest.fn().mockResolvedValue(mockCourse),
          },
        },
        {
          provide: RedisLockManager,
          useValue: {
            withLock: jest.fn((key, fn) => fn()),
          },
        },
        {
          provide: RedisRepository,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            increment: jest.fn(),
          },
        },
      ],
    }).compile();

    applyService = module.get<ApplyService>(ApplyService);
    applyRepository = module.get<ApplyRepository>(ApplyRepository);
    courseRepository = module.get<CourseRepository>(CourseRepository);
    redisLockManager = module.get<RedisLockManager>(RedisLockManager);
    redisRepository = module.get<RedisRepository>(RedisRepository);
  });

  describe('applyForCourse', () => {
    it('신청이 성공적으로 처리되어야 한다', async () => {
      redisRepository.get = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null); // 유저가 신청한 적 없음
      redisRepository.increment = jest.fn().mockResolvedValue(undefined);

      const result = await applyService.applyForCourse(mockApplyData);

      expect(result).toBeInstanceOf(CourseApplyHistory);
      expect(redisLockManager.withLock).toHaveBeenCalledWith(mockApplyData.courseId.toString(), expect.any(Function));
      expect(redisRepository.increment).toHaveBeenCalledWith(`course:${mockApplyData.courseId}:applies`);
      expect(applyRepository.createApply).toHaveBeenCalledWith(mockApplyData);
    });

    it('코스 인원이 가득 찼다면 에러를 발생시켜야 한다', async () => {
      redisRepository.get = jest.fn().mockResolvedValueOnce(3); // 신청 인원이 가득 찼음
      await expect(applyService.applyForCourse(mockApplyData)).rejects.toThrow('신청 인원이 가득 찼습니다.');
    });

    it('이미 신청한 유저라면 에러를 발생시켜야 한다', async () => {
      redisRepository.get = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce('true'); // 이미 신청한 유저
      await expect(applyService.applyForCourse(mockApplyData)).rejects.toThrow('이미 신청한 유저입니다. 10초에 한번만 신청할 수 있습니다.');
    });

    it('동시에 신청할 때 올바르게 처리되어야 한다', async () => {
      redisRepository.get = jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      redisLockManager.withLock = jest.fn((key, fn) => fn());
      
      const concurrentApplies = Array.from({ length: 3 }, (_, i) => {
        return applyService.applyForCourse({ ...mockApplyData, userId: i + 1 });
      });

      const results = await Promise.all(concurrentApplies);
      expect(results).toHaveLength(3); // 모든 신청이 처리되어야 함
      expect(redisRepository.increment).toHaveBeenCalledTimes(3); // 신청 카운트가 3번 증가해야 함
    });
  });


  it('동일한 자원에 대한 신청을 순차적으로 처리해야 한다.', async () => {
    const results: CourseApplyHistory[] = [];
    redisRepository.get = jest.fn().mockResolvedValueOnce(null); // 신청 전, 유저가 신청한 적 없음
    redisLockManager.withLock = jest.fn((key, fn) => fn()); // 락을 적용

    const applyPromises = Array.from({ length: 5 }, (_, i) => {
      return applyService.applyForCourse({ userId: 1, courseId: 1 });
    });

    const resolvedResults = await Promise.all(applyPromises);
    resolvedResults.forEach((result) => results.push(result));

    expect(results).toHaveLength(5); // 모든 신청이 처리되어야 함
    expect(applyRepository.createApply).toHaveBeenCalledTimes(5); // 5번 호출되었는지 확인
  });

  it('50명이 신청할 때, 수용 인원 30명의 과정에 대해 30개의 신청만 성공하고 나머지 20개는 실패해야 한다.', async () => {
    // 초기 설정
    courseRepository.findCourseById = jest.fn().mockResolvedValue(mockCourse);
    redisRepository.get = jest.fn().mockResolvedValue(0); // 신청 인원 초기화

    const successfulApplies: Promise<CourseApplyHistory>[] = [];
    for (let i = 1; i <= 50; i++) {
      successfulApplies.push(applyService.applyForCourse({ userId: i, courseId: 1 }));
    }

    const results = await Promise.allSettled(successfulApplies);

    const successfulCount = results.filter(result => result.status === 'fulfilled').length;
    const failedCount = results.filter(result => result.status === 'rejected').length;

    expect(successfulCount).toBe(30); // 성공한 신청 수
    expect(failedCount).toBe(20); // 실패한 신청 수
    expect(applyRepository.createApply).toHaveBeenCalledTimes(30); // 30번 호출
  });
});
