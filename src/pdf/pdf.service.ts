import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as pdfParser from 'pdf-parse';
import { execSync } from 'child_process'; // Utilisation de child_process pour exécuter le script Python

@Injectable()
export class PdfService {
  private readonly pdfFilePath = './pdfs/canon_avicenna.pdf'; // chemin vers ton fichier PDF

  async searchKeyword(keyword: string): Promise<any> {
    try {
      // Lire et parser le PDF
      const pdfBuffer = fs.readFileSync(this.pdfFilePath); // Lire le fichier PDF en tant que buffer
      const data = await pdfParser(pdfBuffer); // Parser le fichier PDF

      let excerpts = []; // Tableau pour stocker les extraits trouvés

      // Parcourir chaque page du PDF pour chercher le mot-clé
      const numPages = data.numpages; // Obtenir le nombre de pages
      for (let i = 0; i < numPages; i++) {
        const pageText = data.text; // Extraire le texte de toutes les pages

        // Si le texte de la page contient le mot-clé
        if (pageText.toLowerCase().includes(keyword.toLowerCase())) {
          const excerpt = this.extractExcerpt(pageText, keyword, 3000); // Extraire un contexte autour du mot-clé
          excerpts.push({ pageNumber: i, excerpt }); // Ajouter l'extrait trouvé au tableau
        }
      }

      // Si des extraits sont trouvés, on appelle le script Python pour générer un résumé
      if (excerpts.length > 0) {
        const summary = await this.generateSummary(excerpts.map(ex => ex.excerpt).join('\n\n')); // Générer un résumé avec le script Python
        return { found: true, summary, excerpts }; // Retourner le résumé et les extraits
      } else {
        return { found: false }; // Retourner false si aucun mot-clé trouvé
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier PDF:', error); // Loguer les erreurs
      return { error: 'Erreur lors de la lecture du fichier PDF.' }; // Retourner une erreur en cas d'échec
    }
  }

  // Méthode pour générer un résumé en utilisant le script Python
  private async generateSummary(pdfText: string): Promise<string> {
    try {
      const summary = execSync(`python python_scripts/nlp_service.py "${pdfText.replace(/"/g, '\\"')}"`).toString(); // Appeler le script Python
      return summary.trim(); // Retourner le texte généré par le script Python
    } catch (error) {
      console.error('Erreur lors de l\'exécution du script Python:', error); // Loguer les erreurs
      return 'Erreur lors de l\'exécution du script Python.';
    }
  }

  // Méthode pour extraire un extrait autour du mot-clé dans le texte
  private extractExcerpt(text: string, keyword: string, contextLength: number = 3000): string {
    const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase()); // Trouver l'index du mot-clé
    const start = Math.max(0, keywordIndex - contextLength); // Calculer le début du contexte
    const end = Math.min(text.length, keywordIndex + keyword.length + contextLength); // Calculer la fin du contexte
    const excerpt = text.slice(start, end); // Extraire la portion de texte
    const keywordRegex = new RegExp(`(${keyword})`, 'gi'); // Mettre en gras le mot-clé dans l'extrait
    return excerpt.replace(keywordRegex, '**$1**'); // Remplacer le mot-clé par sa version avec mise en gras
  }
}
