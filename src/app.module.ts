import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PdfModule } from './pdf/pdf.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Chemin vers le dossier des fichiers statiques
    }),
    PdfModule, // Assurez-vous que PdfModule est correctement importé ici
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
