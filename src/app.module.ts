import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnotateController } from './annotate.controller';
import { AnnotateService } from './annotate.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, AnnotateController],
  providers: [AppService, AnnotateService],
})
export class AppModule {}
