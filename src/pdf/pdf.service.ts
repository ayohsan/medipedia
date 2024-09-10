import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly filePath = path.join(__dirname, '..', '..', 'public', 'pdf', 'your-file.pdf');

  async extractTextFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  async searchKeyword(keyword: string): Promise<boolean> {
    const text = await this.extractTextFromPDF(this.filePath);
    return text.includes(keyword);
  }
}
