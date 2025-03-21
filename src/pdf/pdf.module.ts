import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';

/**
 * Le module PdfModule est responsable d'importer les composants (Service et Controller)
 * nécessaires pour gérer la logique liée aux PDF.
 */
@Module({
  providers: [PdfService], // Déclare le PdfService comme un fournisseur du module
  controllers: [PdfController] // Déclare le PdfController comme le contrôleur de ce module
})
export class PdfModule {}
