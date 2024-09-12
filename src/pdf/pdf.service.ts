import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as pdfParser from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';

/**
 * Service responsable de la logique métier, ici la recherche de mots-clés dans un fichier PDF.
 * Il effectue la lecture et le parsing du fichier PDF et retourne les résultats de la recherche.
 */
@Injectable()
export class PdfService {
  private readonly pdfFilePath = './pdfs/canon_avicenna.pdf'; // Spécifie le chemin du fichier PDF à lire

  /**
   * Recherche un mot-clé dans le PDF et retourne le résultat.
   * @param keyword : le mot-clé à rechercher
   * @returns : résultat de la recherche
   */
  async searchKeyword(keyword: string): Promise<any> {
    try {
      // Lire le fichier PDF à partir du chemin
      const pdfBuffer = fs.readFileSync(this.pdfFilePath);

      // Parse le fichier PDF pour obtenir le texte
      const data = await pdfParser(pdfBuffer);

      // Charger le document PDF avec pdf-lib pour obtenir le nombre de pages
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const numberOfPages = pdfDoc.getPageCount();

      let pageNumber = -1;
      let excerpt = '';

      for (let i = 0; i < numberOfPages; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();

        // Extraire le texte de chaque page
        const pageText = await this.extractTextFromPage(page);

        if (pageText.toLowerCase().includes(keyword.toLowerCase())) {
          pageNumber = i; // Page number starting from 0
          excerpt = this.extractExcerpt(pageText, keyword, 3000);
          break;
        }
      }

      if (pageNumber !== -1) {
        return { found: true, pageNumber, excerpt };
      } else {
        return { found: false }; // Mot-clé non trouvé
      }
    } catch (error) {
      // Gère les erreurs (par ex. fichier introuvable, erreurs de parsing)
      console.error('Erreur lors de la lecture du fichier PDF:', error);
      return { error: 'Erreur lors de la lecture du fichier PDF.' };
    }
  }

  /**
   * Fonction pour extraire un extrait autour du mot-clé dans le texte.
   * @param text : texte du PDF
   * @param keyword : mot-clé recherché
   * @param contextLength : longueur du contexte autour du mot-clé
   * @returns : extrait du texte autour du mot-clé
   */
  private extractExcerpt(text: string, keyword: string, contextLength: number = 3000): string {
    // Trouver l'index du mot-clé dans le texte
    const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());

    if (keywordIndex === -1) {
      return `Le mot '${keyword}' n'a pas été trouvé dans le texte.`;
    }

    // Calculer les indices de début et de fin pour l'extraction
    const start = Math.max(0, keywordIndex - contextLength);
    const end = Math.min(text.length, keywordIndex + keyword.length + contextLength);

    // Extraire le contexte
    const excerpt = text.slice(start, end);

    // Mettre le mot-clé en gras
    const keywordRegex = new RegExp(`(${keyword})`, 'gi');
    return excerpt.replace(keywordRegex, '**$1**');
  }

  /**
   * Fonction pour extraire le texte d'une page PDF (avec pdf-lib).
   * @param page : la page du PDF à traiter
   * @returns : texte extrait de la page
   */
  private async extractTextFromPage(page: any): Promise<string> {
    const { width, height } = page.getSize();
    const text = await page.getTextContent();
    return text.items.map((item: any) => item.str).join(' ');
  }
}
