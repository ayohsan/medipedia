import { Controller, Get, Query } from '@nestjs/common';
import { PdfService } from './pdf.service';

/**
 * Le contrôleur gère les requêtes entrantes (GET, POST, etc.) et appelle les services correspondants.
 * Le contrôleur PdfController traite les recherches de mots-clés dans les PDF.
 */
@Controller('pdf') // Ce contrôleur gère toutes les routes qui commencent par /pdf
export class PdfController {
  constructor(private readonly pdfService: PdfService) {} // Injection du service PdfService

  /**
   * Endpoint GET /pdf/search
   * Recherche un mot-clé dans un PDF en fonction du paramètre 'keyword' de la requête.
   * @param keyword : le mot-clé à rechercher, passé en paramètre de requête
   */
  @Get('search')
  async search(@Query('keyword') keyword: string) {
    // Vérifie si un mot-clé est fourni
    if (!keyword) {
      return { error: 'Le mot-clé est requis.' };
    }

    // Appelle le service pour rechercher le mot-clé dans le PDF
    const result = await this.pdfService.searchKeyword(keyword);
    return result;
  }
}
