import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnotateController } from './annotate.controller';
import { AnnotateService } from './annotate.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, AnnotateController],
  providers: [AppService, AnnotateService, CloudinaryService],
})
export class AppModule {}
