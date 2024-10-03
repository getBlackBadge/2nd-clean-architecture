import { Controller, Post, Get, Param, Query, Body, ParseIntPipe } from '@nestjs/common';
import { ApplyService } from '../service/apply.service';
import { ApplyCourseDto } from '../apply.dto';

@Controller('courses/apply')
export class ApplyController {
  constructor(private readonly applyService: ApplyService) {}

  @Post(':courseId')
  async applyCourse(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() applyData: ApplyCourseDto
  ) {
    // TODO: validate userId, courseId
    // applyData에 courseId를 추가하여 전달합니다.
    applyData.courseId = courseId; // URL에서 받은 courseId를 applyData에 추가합니다.
    return this.applyService.applyForCourse(applyData);
  }

  @Get('')
  async getAppliedCourses(@Query('userId', ParseIntPipe) userId: number) {
    return this.applyService.getUserApplies(userId);
  }
}
