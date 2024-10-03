import { EntityManager, Repository, Between, FindManyOptions } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Course } from '../course.entity';
import { ICourseRepository } from './course.repository.interface';
@Injectable()
export class CourseRepository extends Repository<Course> implements ICourseRepository {
 constructor(private readonly entityManager: EntityManager) {
    super(Course, entityManager);
  }

  async findCourses(
    startAt?: Date,
    endAt?: Date,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Course[]> {
    const options: FindManyOptions<Course> = {
      take: limit,
      skip: offset,
      order: {
        startAt: 'ASC',
      },
    };

    if (startAt && endAt) {
      options.where = {
        startAt: Between(startAt, endAt),
      };
    }

    return this.find(options);
  }

  async findCourseById(id: number): Promise<Course | null> {
    return this.findOne({ where: { id } });
  }
}
