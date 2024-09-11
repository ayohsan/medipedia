import { Controller, Get, Query } from '@nestjs/common';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('search')
  async search(@Query('keyword') keyword: string) {
    if (!keyword) {
      return { error: 'Le mot-clé est requis.' };
    }
    const result = await this.pdfService.searchKeyword(keyword);
    return result;
  }
}
