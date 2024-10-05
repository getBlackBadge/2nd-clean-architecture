import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from './course.service';
import { CourseRepository } from '../repository/course.repository';

describe('CourseService', () => {
  let service: CourseService;
  let repository: CourseRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: CourseRepository,
          useValue: {
            findCourses: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    repository = module.get<CourseRepository>(CourseRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCourses', () => {
    it('should call findCourses with correct parameters', async () => {
      const startAt = new Date('2023-01-01');
      const endAt = new Date('2023-12-31');
      const limit = 20;
      const offset = 5;

      await service.getCourses(startAt, endAt, limit, offset);

      expect(repository.findCourses).toHaveBeenCalledWith(startAt, endAt, limit, offset);
    });

    it('should use default values when not provided', async () => {
      await service.getCourses();

      expect(repository.findCourses).toHaveBeenCalledWith(undefined, undefined, 10, 0);
    });

    it('should return the result from the repository', async () => {
      const expectedResult = [{ id: 1, name: 'Test Course' }];
      (repository.findCourses as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.getCourses();

      expect(result).toEqual(expectedResult);
    });
  });
});