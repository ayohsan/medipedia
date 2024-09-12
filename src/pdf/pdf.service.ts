import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly filePath = path.join(__dirname, '..', '..', 'pdfs','canon_avicenna.pdf');

  private async extractTextFromPDF(filePath: string): Promise<string[]> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      // Diviser le texte par page (si '\f' est le séparateur de pages)
      const pages = pdfData.text.split('\f'); 

      return pages;
    } catch (error) {
      console.error('Error reading or parsing PDF:', error);
      throw new Error('Unable to process PDF file.');
    }
  }

  async searchKeyword(keyword: string): Promise<{ excerpt: string, pageNumber: number | undefined }> {
    try {
      const pages = await this.extractTextFromPDF(this.filePath);
      
      let excerpt = '';
      let pageNumber: number | undefined;

      // Rechercher le mot-clé dans chaque page
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].includes(keyword)) {
          excerpt = pages[i];
          pageNumber = i; // Page indexée à partir de 0
          break;
        }
      }

      return { excerpt, pageNumber };
    } catch (error) {
      console.error('Error during keyword search:', error);
      throw new Error('Unable to search keyword in PDF.');
    }
  }
}
