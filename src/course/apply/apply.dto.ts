import { IsNotEmpty, IsNumber, IsOptional, IsDate } from 'class-validator';

export class ApplyCourseDto {
  @IsNotEmpty()
  @IsNumber()
  courseId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsDate()
  registrationDatetime?: Date;
}