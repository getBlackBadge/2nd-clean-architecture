import { CourseApplyHistory } from '../apply.entity';
import { ApplyCourseDto } from '../apply.dto';

export interface IApplyRepository {
    createApply(applyData: ApplyCourseDto): Promise<CourseApplyHistory>;
    findAppliesByUserId(userId: number): Promise<CourseApplyHistory[]>;
    findAppliesCountByCourseId(courseId: number): Promise<number>;
  }