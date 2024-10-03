import { Controller, Post, Get, Param, Query, Body } from '@nestjs/common';
import { CourseService } from '../service/course.service';
import { GetCoursesDto } from '../course.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async getCourses(@Query() getCoursesDto: GetCoursesDto) {
    const { startAt, endAt, limit = 10, offset = 0 } = getCoursesDto;
    
    const startDate = startAt ? new Date(startAt) : null;
    const endDate = endAt ? new Date(endAt) : null;
    
    return this.courseService.getCourses(startDate, endDate, limit, offset);
  }

}
