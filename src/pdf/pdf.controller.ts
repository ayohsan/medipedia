import { Controller, Get, Query } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('search')
  async searchInPDF(@Query('keyword') keyword: string): Promise<{ found: boolean, excerpt?: string }> {
    const text = await this.pdfService.extractTextFromPDF('pdfs/canon_avicenna.pdf');
    const found = text.includes(keyword);
  
    // Trouver un extrait du texte autour du mot-clé
    let excerpt = '';
    if (found) {
      const index = text.indexOf(keyword);
      const start = Math.max(0, index - 100); // Prend 100 caractères avant le mot-clé
      const end = Math.min(text.length, index + keyword.length + 100); // Prend 100 caractères après le mot-clé
      excerpt = text.slice(start, end);
    }
  
    return { found, excerpt };
  }
} 