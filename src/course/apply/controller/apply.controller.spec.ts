import { Test, TestingModule } from '@nestjs/testing';
import { ApplyController } from './apply.controller';
import { ApplyService } from '../service/apply.service';
import { ApplyCourseDto } from '../apply.dto';

describe('ApplyController', () => {
  let controller: ApplyController;
  let service: ApplyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplyController],
      providers: [
        {
          provide: ApplyService,
          useValue: {
            applyForCourse: jest.fn(),
            getUserApplies: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ApplyController>(ApplyController);
    service = module.get<ApplyService>(ApplyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('applyCourse', () => {
    it('과정에 대한 신청을 처리해야 한다.', async () => {
      const courseId = 1;
      const applyData: ApplyCourseDto = { userId: 1, courseId };

      await controller.applyCourse(courseId, applyData);

        expect(service.applyForCourse).toHaveBeenCalledWith(applyData);
    });
  });

  describe('getAppliedCourses', () => {
    it('유저의 신청을 찾아야 한다.', async () => {
      const userId = 1;

      await controller.getAppliedCourses(userId);

      expect(service.getUserApplies).toHaveBeenCalledWith(userId);
    });
  });
});