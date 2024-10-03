import { Module, Global } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import AppDataSource from './database/ormconfig';
import { CourseModule } from './course/course.module';
import { redisProvider } from './database/redisconfig';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(AppDataSource.options),
    CourseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    redisProvider,
  ],
  exports: [redisProvider],
})
export class AppModule {}