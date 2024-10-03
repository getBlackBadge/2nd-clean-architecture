import { Course } from '../course.entity';

export interface ICourseRepository {
  findCourses(
    startAt?: Date,
    endAt?: Date,
    limit?: number,
    offset?: number
  ): Promise<Course[]>;

  findCourseById(id: number): Promise<Course | null>;
}