import { Test, TestingModule } from '@nestjs/testing';
import { CourseController } from './course.controller';
import { CourseService } from '../service/course.service';
import { GetCoursesDto } from '../course.dto';

describe('CourseController', () => {
  let controller: CourseController;
  let service: CourseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        {
          provide: CourseService,
          useValue: {
            getCourses: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CourseController>(CourseController);
    service = module.get<CourseService>(CourseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCourses', () => {
    it(
      'courseService.getCourses를 올바른 매개변수로 호출해야 한다.', async () => {
      const getCoursesDto: GetCoursesDto = {
        startAt: '2023-01-01',
        endAt: '2023-12-31',
        limit: 20,
        offset: 5,
      };

      await controller.getCourses(getCoursesDto);

      expect(service.getCourses).toHaveBeenCalledWith(
        new Date('2023-01-01'),
        new Date('2023-12-31'),
        20,
        5
      );
    });

    it('매개변수가 제공되지 않으면 기본값을 사용해야 한다.', async () => {
      const getCoursesDto: GetCoursesDto = {};

      await controller.getCourses(getCoursesDto);

      expect(service.getCourses).toHaveBeenCalledWith(
        null,
        null,
        10,
        0
      );
    });

    it('courseService.getCourses의 결과를 반환해야 한다.', async () => {
      const mockResult = [{ id: 1, name: 'Test Course' }];
      (service.getCourses as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getCourses({});

      expect(result).toEqual(mockResult);
    });
  });
});