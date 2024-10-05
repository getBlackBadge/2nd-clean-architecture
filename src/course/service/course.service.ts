import { Injectable } from '@nestjs/common';
import { CourseRepository } from '../repository/course.repository';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async getCourses(
    startAt?: Date,
    endAt?: Date,
    limit: number = 10,
    offset: number = 0,
  ) {
    return this.courseRepository.findCourses(startAt, endAt, limit, offset);
  }
}
