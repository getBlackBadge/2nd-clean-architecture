import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseRepository } from './course.repository';
import { Course } from '../course.entity';

describe('CourseRepository', () => {
  let courseRepository: CourseRepository;
  let mockRepository: jest.Mocked<Repository<Course>>;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseRepository,
        {
          provide: getRepositoryToken(Course),
          useValue: mockRepository,
        },
      ],
    }).compile();

    courseRepository = module.get<CourseRepository>(CourseRepository);
  });

  describe('findCourses', () => {
    it('기본 매개변수로 교육 과정을 찾아야 한다.', async () => {
      const expectedOptions = {
        take: 10,
        skip: 0,
        order: { startAt: 'ASC' },
      };
      await courseRepository.findCourses();
      expect(mockRepository.find).toHaveBeenCalledWith(expectedOptions);
    });

    it('매개변수를 사용하여 교육 과정을 찾아야 한다.', async () => {
      const startAt = new Date('2023-01-01');
      const endAt = new Date('2023-12-31');
      const expectedOptions = {
        take: 20,
        skip: 5,
        order: { startAt: 'ASC' },
        where: { startAt: expect.any(Object) },
      };
      await courseRepository.findCourses(startAt, endAt, 20, 5);
      expect(mockRepository.find).toHaveBeenCalledWith(expectedOptions);
    });
  });

  describe('findCourseById', () => {
    it('교육 과정을 아이디로 찾아야 한다.', async () => {
      const id = 1;
      await courseRepository.findCourseById(id);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id } });
    });
  });
});