import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PdfModule } from './pdf/pdf.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { ConfigModule } from '@nestjs/config';
import { PdfService } from './pdf/pdf.service';
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..'),
      exclude: ['/api*', '/pdf*'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    PdfModule, // Assurez-vous que PdfModule est correctement importé ici
  ],
  controllers: [AppController],
  providers: [AppService, PdfService],
  exports: [PdfService],
})
export class AppModule {}
