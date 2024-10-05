import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplyRepository } from './apply.repository';
import { CourseApplyHistory } from '../apply.entity';
import { ApplyCourseDto } from '../apply.dto';

describe('ApplyRepository', () => {
  let applyRepository: ApplyRepository;
  let mockRepository: Partial<Repository<CourseApplyHistory>>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplyRepository,
        {
          provide: getRepositoryToken(CourseApplyHistory),
          useValue: mockRepository,
        },
      ],
    }).compile();

    applyRepository = module.get<ApplyRepository>(ApplyRepository);
  });

  describe('createApply', () => {
    it('새로운 신청을 생성하고 저장해야 한다.', async () => {
      const applyData: ApplyCourseDto = {
        userId: 1,
        courseId: 1,
      };

      const mockApply = {
        id: 1,
        user: { id: applyData.userId },
        course: { id: applyData.courseId },
      };

      (mockRepository.create as jest.Mock).mockReturnValue(mockApply);
      (mockRepository.save as jest.Mock).mockResolvedValue(mockApply);

      const result = await applyRepository.createApply(applyData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        user: { id: applyData.userId },
        course: { id: applyData.courseId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockApply);
      expect(result).toEqual(mockApply);
    });

    it('저장에 실패하면 에러를 반환해야 한다.', async () => {
      const applyData: ApplyCourseDto = {
        userId: 1,
        courseId: 1,
      };

      (mockRepository.create as jest.Mock).mockReturnValue({});
      (mockRepository.save as jest.Mock).mockRejectedValue(new Error('Save failed'));

      await expect(applyRepository.createApply(applyData)).rejects.toThrow('Failed to create apply');
    });
  });

  describe('findAppliesByUserId', () => {
    it('유저의 신청을 찾아야 한다.', async () => {
      const userId = 1;
      const mockApplies = [{ id: 1, user: { id: userId }, course: { id: 1 } }];

      (mockRepository.find as jest.Mock).mockResolvedValue(mockApplies);

      const result = await applyRepository.findAppliesByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { user: { id: userId } },
        relations: ['user', 'course'],
      });
      expect(result).toEqual(mockApplies);
    });
  });

  describe('findAppliesCountByCourseId', () => {
    it('과정의 신청 수를 세어야 한다.', async () => {
      const courseId = 1;
      const mockCount = 5;

      (mockRepository.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await applyRepository.findAppliesCountByCourseId(courseId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { course: { id: courseId } },
      });
      expect(result).toEqual(mockCount);
    });
  });
});