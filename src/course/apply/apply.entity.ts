import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../common/user/user.entity';
import { Course } from '../course.entity';

@Entity('course_apply_histories')
@Unique(['user', 'course'])
export class CourseApplyHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Course, (course) => course.id)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @CreateDateColumn({ name: 'registration_datetime' })
  registrationDatetime: Date;
}