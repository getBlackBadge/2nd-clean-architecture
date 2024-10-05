import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseApplyHistory } from '../apply.entity';
import { ApplyCourseDto } from '../apply.dto'
import { IApplyRepository } from './apply.repository.interface';
@Injectable()
export class ApplyRepository implements IApplyRepository {
  constructor(
    @InjectRepository(CourseApplyHistory)
    private readonly applyRepository: Repository<CourseApplyHistory>,
  ) {}

  async createApply(applyData: ApplyCourseDto): Promise<CourseApplyHistory> {
    try {
      const apply = this.applyRepository.create({
        user: { id: applyData.userId },
        course: { id: applyData.courseId },
      });
      
      console.log('Apply to be saved:', apply);
      
      const savedApply = await this.applyRepository.save(apply);
      
      console.log('Saved apply:', savedApply);
      
      return savedApply;
    } catch (error) {
      console.error('Error creating apply:', error);
      throw new Error('Failed to create apply');
    }
  }
  

  async findAppliesByUserId(userId: number): Promise<CourseApplyHistory[]> {
    return this.applyRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'course'],
    });
  }

  async findAppliesCountByCourseId(courseId: number): Promise<number> {
    return this.applyRepository.count({
      where: { course: { id: courseId } },
    });
  } 


}
