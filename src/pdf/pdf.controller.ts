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
    try {
      console.log('Recherche pour:', keyword); // Debug
      const result = await this.pdfService.searchKeyword(keyword);
      console.log('Résultat de la recherche:', result); // Debug
      return result;
    } catch (error) {
      console.error('Erreur contrôleur:', error);
      return {
        found: false,
        error: true,
        message: 'Erreur lors de la recherche'
      };
    }
  }

  @Get('test-api')
  async testHuggingFaceAPI() {
    return await this.pdfService.testApiConnection();
  }
}
