import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as pdfParser from 'pdf-parse';
import { execSync } from 'child_process'; // Utilisation de child_process pour exécuter le script Python
import fetch from 'node-fetch';

export interface Context {
  before: string;
  keyword: string;
  after: string;
  fullContext: string;
}

export interface SearchResult {
  found: boolean;
  contexts?: Context[];
  summary?: string;
  globalSummary?: string;
  totalOccurrences?: number;
  message?: string;
  error?: boolean;
  summaryHistory?: SummaryHistory[];
}

interface CacheEntry {
  result: string;
  timestamp: number;
}

interface HuggingFaceResponse {
  generated_text: string;
}

interface AIPrompt {
  text: string;
  parameters: {
    max_length: number;
    temperature: number;
    return_full_text: boolean;
  };
}

interface SummaryHistory {
  keyword: string;
  summary: string;
  timestamp: number;
}

@Injectable()
export class PdfService implements OnModuleInit {
  private pdfPath: string;
  private pdfData: any;
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_DURATION: number;
  private readonly FALLBACK_MODEL: string;
  private readonly MAX_RETRIES: number;
  private readonly RETRY_DELAY: number;
  private readonly MAX_CONCURRENT_REQUESTS: number;
  private activeRequests: number;
  private requestQueue: Array<() => Promise<void>>;
  private summaryHistory: SummaryHistory[] = [];
  private readonly MAX_HISTORY_SIZE = 5;

  constructor() {
    this.pdfPath = path.join(__dirname, '..', '..', 'pdfs', 'canon_avicenna.pdf');
    this.pdfData = null;
    this.cache = new Map();
    this.CACHE_DURATION = 1000 * 60 * 60; // 1 heure
    this.FALLBACK_MODEL = 'flaubert/flaubert_base_cased';
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 1000;
    this.MAX_CONCURRENT_REQUESTS = 5;
    this.activeRequests = 0;
    this.requestQueue = [];
  }

  async onModuleInit(): Promise<void> {
    try {
      if (!fs.existsSync(this.pdfPath)) {
        console.error('PDF file not found:', this.pdfPath);
        return;
      }
      const dataBuffer = fs.readFileSync(this.pdfPath);
      this.pdfData = await pdfParser(dataBuffer);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  async searchKeyword(keyword: string): Promise<SearchResult> {
    try {
      if (!this.pdfData?.text) {
        return {
          found: false,
          message: 'Erreur: Le PDF est vide ou n\'a pas été chargé correctement.'
        };
      }

      const contexts = this.findAllContexts(this.pdfData.text, keyword);
      
      if (contexts.length > 0) {
        const aiAnalysis = await this.generateAIAnalysis(contexts, keyword);
        
        // Ajouter le résumé à l'historique
        this.addToSummaryHistory(keyword, aiAnalysis);
        
        // Générer le résumé global
        const globalSummary = await this.generateGlobalSummary();

        return {
          found: true,
          contexts: contexts.slice(0, 5),
          summary: aiAnalysis,
          globalSummary,
          totalOccurrences: contexts.length,
          summaryHistory: this.summaryHistory
        };
      }

      return {
        found: false,
        message: `Aucune occurrence du mot "${keyword}" n'a été trouvée.`
      };
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return {
        error: true,
        found: false,
        message: `Erreur lors de la recherche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  private async generateAIAnalysis(contexts: Context[], keyword: string): Promise<string> {
    try {
      // Extraire le contexte pertinent pour le citron
      const relevantContext = contexts.find(context => 
        context.fullContext.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!relevantContext) {
        return `Aucun contexte pertinent trouvé pour "${keyword}"`;
      }

      // Créer un prompt plus court et plus précis
      const prompt = `Résumer en français (100 mots max) l'utilisation médicale de "${keyword}" dans ce contexte : ${relevantContext.fullContext.slice(0, 200)}`;

      try {
        const result = await this.callHuggingFaceAPI('facebook/bart-large-cnn', prompt);
        console.log('Réponse de l\'API:', result); // Debug
        return result || this.generateLocalSummary([relevantContext], keyword);
      } catch (error) {
        console.error('Erreur API détaillée:', error);
        return this.generateLocalSummary([relevantContext], keyword);
      }
    } catch (error) {
      console.error('Erreur dans generateAIAnalysis:', error);
      return `Erreur lors de l'analyse de "${keyword}"`;
    }
  }

  private async checkCache(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }
    
    if (Math.random() < 0.1) {
      this.cleanCache();
    }
    
    return null;
  }

  private setCache(key: string, result: string): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  private preparePrompt(keyword: string, contexts: string[]): string {
    return `Analyser le terme "${keyword}" dans le contexte médical suivant:
${contexts.join('\n\n')}
Fournir une analyse détaillée des utilisations, implications médicales et recommandations.`;
  }

  private generateLocalSummary(contexts: Array<any>, keyword: string): string {
    const contextCount = contexts.length;
    const firstContext = contexts[0]?.fullContext || '';
    
    return `Analyse basique du terme "${keyword}" :
- Trouvé ${contextCount} fois dans le texte
- Premier contexte : ${firstContext.substring(0, 200)}...
Note: Cette analyse est générée localement suite à une indisponibilité du service IA.`;
  }

  private analyzeThemes(contexts: Array<any>): string[] {
    // Analyse simplifiée des thèmes récurrents
    const themes = new Set<string>();
    
    contexts.forEach(context => {
      const fullContext = `${context.before} ${context.keyword} ${context.after}`;
      
      // Analyse basique des thèmes selon les mots-clés présents
      if (fullContext.toLowerCase().includes('traitement')) {
        themes.add('Aspects thérapeutiques et traitements');
      }
      if (fullContext.toLowerCase().includes('symptôme') || fullContext.toLowerCase().includes('maladie')) {
        themes.add('Description des symptômes et pathologies');
      }
      if (fullContext.toLowerCase().includes('propriété') || fullContext.includes('vertu')) {
        themes.add('Propriétés médicinales');
      }
      if (fullContext.toLowerCase().includes('préparation') || fullContext.toLowerCase().includes('utilisation')) {
        themes.add('Méthodes de préparation et d\'utilisation');
      }
    });

    return Array.from(themes);
  }

  private analyzeMedicalImplications(contexts: Array<any>): string {
    const implications = new Set<string>();
    const interactions = new Set<string>();
    const sideEffects = new Set<string>();
    
    contexts.forEach(context => {
      const fullContext = `${context.before} ${context.keyword} ${context.after}`.toLowerCase();
      
      // Analyse des implications médicales générales
      if (fullContext.includes('traitement') || fullContext.includes('guérison')) {
        implications.add('Utilisation thérapeutique et curative');
      }
      if (fullContext.includes('prévention') || fullContext.includes('prophylaxie')) {
        implications.add('Rôle préventif et prophylactique');
      }
      if (fullContext.includes('contre-indication') || fullContext.includes('risque')) {
        implications.add('Précautions et contre-indications');
      }

      // Analyse détaillée des interactions
      if (fullContext.includes('interaction') || fullContext.includes('association')) {
        if (fullContext.includes('renforcer') || fullContext.includes('augmenter')) {
          interactions.add('Potentialisation des effets');
        }
        if (fullContext.includes('diminuer') || fullContext.includes('réduire')) {
          interactions.add('Réduction des effets');
        }
        if (fullContext.includes('neutraliser') || fullContext.includes('annuler')) {
          interactions.add('Neutralisation des effets');
        }
        if (fullContext.includes('toxique') || fullContext.includes('danger')) {
          interactions.add('Interactions toxiques');
        }
      }

      // Analyse des effets secondaires
      if (fullContext.includes('effet secondaire') || fullContext.includes('complication')) {
        sideEffects.add('Effets secondaires signalés');
      }
      if (fullContext.includes('nausée') || fullContext.includes('vomissement')) {
        sideEffects.add('Troubles digestifs');
      }
      if (fullContext.includes('allergie') || fullContext.includes('réaction')) {
        sideEffects.add('Réactions allergiques');
      }
      if (fullContext.includes('fatigue') || fullContext.includes('faiblesse')) {
        sideEffects.add('Effets sur la vitalité');
      }
    });

    let result = '';

    // Implications médicales
    if (implications.size > 0) {
      result += "Implications médicales générales :\n";
      result += Array.from(implications).map(imp => `- ${imp}`).join('\n');
      result += '\n\n';
    }

    // Interactions médicamenteuses
    if (interactions.size > 0) {
      result += "Interactions médicamenteuses :\n";
      result += Array.from(interactions).map(inter => `- ${inter}`).join('\n');
      result += '\n\n';
    }

    // Effets secondaires
    if (sideEffects.size > 0) {
      result += "Effets secondaires potentiels :\n";
      result += Array.from(sideEffects).map(effect => `- ${effect}`).join('\n');
    }

    if (result === '') {
      return "Les implications médicales spécifiques ne sont pas clairement définies dans les contextes analysés.";
    }

    return result;
  }

  private analyzePracticalUses(contexts: Array<any>): string {
    const uses = new Set<string>();
    const dosages = new Set<string>();
    const preparations = new Set<string>();
    
    contexts.forEach(context => {
      const fullContext = `${context.before} ${context.keyword} ${context.after}`.toLowerCase();
      
      // Analyse des préparations
      if (fullContext.includes('préparation') || fullContext.includes('recette')) {
        if (fullContext.includes('infusion') || fullContext.includes('tisane')) {
          preparations.add('Préparation en infusion');
        }
        if (fullContext.includes('décoction') || fullContext.includes('bouillir')) {
          preparations.add('Préparation en décoction');
        }
        if (fullContext.includes('poudre') || fullContext.includes('broyer')) {
          preparations.add('Préparation en poudre');
        }
        if (fullContext.includes('extrait') || fullContext.includes('teinture')) {
          preparations.add('Préparation en extrait');
        }
      }

      // Analyse des dosages
      if (fullContext.includes('dosage') || fullContext.includes('quantité')) {
        if (fullContext.includes('gramme') || fullContext.includes('g ')) {
          dosages.add('Dosage en grammes');
        }
        if (fullContext.includes('cuillère') || fullContext.includes('c.à.c')) {
          dosages.add('Dosage en cuillères');
        }
        if (fullContext.includes('goutte') || fullContext.includes('ml')) {
          dosages.add('Dosage en gouttes ou millilitres');
        }
      }

      // Analyse des modes d'utilisation
      if (fullContext.includes('administration') || fullContext.includes('utilisation')) {
        if (fullContext.includes('oral') || fullContext.includes('boire')) {
          uses.add('Administration orale');
        }
        if (fullContext.includes('externe') || fullContext.includes('appliquer')) {
          uses.add('Application externe');
        }
        if (fullContext.includes('inhalation') || fullContext.includes('respirer')) {
          uses.add('Utilisation par inhalation');
        }
      }
    });

    let result = '';

    if (preparations.size > 0) {
      result += "Méthodes de préparation :\n";
      result += Array.from(preparations).map(prep => `- ${prep}`).join('\n');
      result += '\n\n';
    }

    if (dosages.size > 0) {
      result += "Recommandations de dosage :\n";
      result += Array.from(dosages).map(dosage => `- ${dosage}`).join('\n');
      result += '\n\n';
    }

    if (uses.size > 0) {
      result += "Modes d'administration :\n";
      result += Array.from(uses).map(use => `- ${use}`).join('\n');
    }

    if (result === '') {
      return "Les utilisations pratiques spécifiques ne sont pas clairement définies dans les contextes analysés.";
    }

    return result;
  }

  private cleanAndFormatContext(context: any): string {
    const fullContext = `${context.before} ${context.keyword} ${context.after}`;
    return fullContext
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[^a-zA-Z]+/, '')
      .replace(/[^a-zA-Z]+$/, '')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private generateConclusion(contexts: Array<any>, keyword: string): string {
    const contextCount = contexts.length;
    
    if (contextCount > 10) {
      return `Son importance est soulignée par ses ${contextCount} mentions dans le texte, indiquant un élément central de la médecine traditionnelle.`;
    } else if (contextCount > 5) {
      return `Avec ${contextCount} mentions, cet élément joue un rôle significatif dans la pharmacopée traditionnelle.`;
    } else {
      return `Bien que mentionné ${contextCount} fois, son utilisation semble plus spécifique et ciblée.`;
    }
  }

  private normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Enlève les accents
  }

  private findAllContexts(text: string, keyword: string): Array<{
    before: string,
    keyword: string,
    after: string,
    fullContext: string
  }> {
    try {
      console.log('Début de findAllContexts');
      const contexts = [];
      const normalizedKeyword = this.normalizeWord(keyword);
      
      // Diviser le texte en mots
      const words = text.split(/\s+/);
      let currentPosition = 0;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (this.normalizeWord(word) === normalizedKeyword) {
          // Calculer le contexte avant (150 mots)
          const beforeWords = words.slice(Math.max(0, i - 150), i).join(' ');
          // Calculer le contexte après (300 mots)
          const afterWords = words.slice(i + 1, Math.min(words.length, i + 301)).join(' ');
          
          // Créer le contexte complet
          const fullContext = `${beforeWords} ${word} ${afterWords}`;

          contexts.push({
            before: beforeWords,
            keyword: word,
            after: afterWords,
            fullContext: this.cleanAndFormatContext({
              before: beforeWords,
              keyword: word,
              after: afterWords
            })
          });
        }
        currentPosition += word.length + 1;
      }

      console.log(`Nombre de contextes trouvés: ${contexts.length}`);
      return contexts;
    } catch (error) {
      console.error('Erreur dans findAllContexts:', error);
      return [];
    }
  }

  private formatResults(contexts: Array<any>, keyword: string): string {
    try {
      if (!Array.isArray(contexts)) {
        throw new Error('Les contextes doivent être un tableau');
      }

      // Prendre les 5 premiers contextes
      const selectedContexts = contexts.slice(0, 5);
      
      // Introduction
      let summary = `Analyse des occurrences du terme "${keyword}" (${contexts.length} occurrences trouvées au total)\n\n`;
      
      // Formater chaque contexte
      selectedContexts.forEach((context, index) => {
        summary += `Occurrence ${index + 1}:\n`;
        summary += `...${context.before} **${context.keyword}** ${context.after}...\n\n`;
      });

      // Ajouter une conclusion si il y a plus de contextes
      if (contexts.length > 5) {
        summary += `\nNote: ${contexts.length - 5} autres occurrences ont été trouvées dans le texte.`;
      }

      return summary;
    } catch (error) {
      console.error('Erreur dans formatResults:', error);
      return 'Erreur lors du formatage des résultats.';
    }
  }

  // Nouvelle méthode pour générer un résumé simple
  private generateSimpleSummary(text: string): string {
    // Nettoyer le texte
    const cleanText = text
      .replace(/\*\*/g, '') // Enlever les marqueurs de mise en évidence
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim();

    // Extraire les phrases complètes
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Prendre les 3-5 premières phrases significatives
    const significantSentences = sentences
      .filter(s => s.length > 30) // Filtrer les phrases trop courtes
      .slice(0, 5)
      .join('. ');

    return significantSentences + '.';
  }

  // Méthode pour générer un résumé en utilisant le script Python
  private async generateSummary(pdfText: string): Promise<string> {
    try {
      console.log('Envoi du texte au script Python...');
      const command = `python python_scripts/nlp_service.py "${pdfText.replace(/"/g, '\\"')}"`;
      const summary = execSync(command, {
        maxBuffer: 1024 * 1024 * 10 // Augmente la taille du buffer à 10MB
      }).toString();
      
      if (!summary || summary.trim().length === 0) {
        throw new Error('Le résumé généré est vide');
      }
      
      console.log('Résumé généré avec succès');
      return summary.trim();
    } catch (error) {
      console.error('Erreur détaillée lors de la génération du résumé:', error);
      throw new Error('Erreur lors de la génération du résumé');
    }
  }

  // Amélioration de la méthode extractExcerpt
  private extractExcerpt(text: string, keyword: string, contextLength: number = 150): string {
    try {
      // Convertir en minuscules pour la recherche
      const textLower = text.toLowerCase();
      const keywordLower = keyword.toLowerCase();
      
      // Trouver toutes les occurrences du mot-clé
      let occurrences = [];
      let index = textLower.indexOf(keywordLower);
      while (index !== -1) {
        occurrences.push(index);
        index = textLower.indexOf(keywordLower, index + 1);
      }

      // Extraire le contexte pour chaque occurrence
      let excerpts = occurrences.map(index => {
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + keyword.length + contextLength);
        const excerpt = text.slice(start, end).trim();
        
        // Mettre en évidence le mot-clé
        const keywordRegex = new RegExp(`(${keyword})`, 'gi');
        return excerpt.replace(keywordRegex, '**$1**');
      });

      return excerpts.join('\n\n[...]\n\n');
    } catch (error) {
      console.error('Erreur dans extractExcerpt:', error);
      return '';
    }
  }

  private createDefaultSummary(contexts: Array<any>, keyword: string): string {
    try {
      console.log('Début de createDefaultSummary');
      // Prendre les 5 premiers contextes pour le résumé
      const selectedContexts = contexts.slice(0, 5);
      
      let summary = `Analyse des occurrences du terme "${keyword}" :\n\n`;
      
      selectedContexts.forEach((context, index) => {
        summary += `Extrait ${index + 1}:\n`;
        summary += `${context.before} **${context.keyword}** ${context.after}\n\n`;
      });

      summary += `\nTotal des occurrences trouvées: ${contexts.length}`;
      
      console.log('Résumé créé:', summary);
      return summary;
    } catch (error) {
      console.error('Erreur dans createDefaultSummary:', error);
      return `Trouvé ${contexts.length} occurrences de "${keyword}"`;
    }
  }

  // Gestion de la file d'attente des requêtes
  private async queueRequest(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.requestQueue.push(async () => {
        resolve();
      });
    });
  }

  private processQueue(): void {
    const next = this.requestQueue.shift();
    if (next) {
      next();
    }
  }

  // Système de retry avec backoff exponentiel
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, retries - 1, delay * 2);
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  private async callHuggingFaceAPI(model: string, text: string): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    console.log('Début appel API avec texte:', text.substring(0, 50) + '...'); // Debug
    
    if (!apiKey) {
      console.error('Clé API manquante');
      throw new Error('Clé API Hugging Face non configurée');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              max_length: 100,
              min_length: 30,
              do_sample: false
            }
          }),
          signal: controller.signal
        }
      );

      console.log('Statut de la réponse:', response.status); // Debug

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API détaillée:', {
          status: response.status,
          text: errorText
        });
        throw new Error(`Erreur API (${response.status}): ${errorText}`);
      }

      const data = await response.json() as HuggingFaceResponse[];
      console.log('Données reçues:', data); // Debug

      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        return data[0].generated_text;
      }

      throw new Error('Réponse API invalide');
    } catch (error) {
      console.error('Erreur complète:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private addToSummaryHistory(keyword: string, summary: string): void {
    this.summaryHistory.unshift({
      keyword,
      summary,
      timestamp: Date.now()
    });

    // Garder seulement les 5 derniers résumés
    if (this.summaryHistory.length > this.MAX_HISTORY_SIZE) {
      this.summaryHistory = this.summaryHistory.slice(0, this.MAX_HISTORY_SIZE);
    }
  }

  private async generateGlobalSummary(): Promise<string> {
    if (this.summaryHistory.length === 0) {
      return "Aucun historique de recherche disponible.";
    }

    const summaryContext = this.summaryHistory
      .map(item => `Terme "${item.keyword}": ${item.summary}`)
      .join('\n\n');

    try {
      const prompt = `Générer un résumé global (maximum 500 mots) des dernières recherches effectuées, en mettant en évidence les liens potentiels entre les différents termes et leurs utilisations médicales. Voici les résumés précédents:\n\n${summaryContext}`;

      const globalSummary = await this.callHuggingFaceAPI('facebook/bart-large-cnn', prompt);
      return globalSummary;
    } catch (error) {
      // Fallback si l'API échoue
      return `Résumé des ${this.summaryHistory.length} dernières recherches:\n\n` +
        this.summaryHistory
          .map(item => `- ${item.keyword}: ${this.createShortSummary(item.summary)}`)
          .join('\n\n');
    }
  }

  private createShortSummary(summary: string): string {
    // Prendre les 100 premiers caractères de chaque résumé
    return summary.length > 100 ? 
      summary.substring(0, 100) + '...' : 
      summary;
  }

  // Méthode de test pour le controller
  public async testApiConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const testResult = await this.callHuggingFaceAPI(
        'facebook/bart-large-cnn',
        'Test de connexion à l\'API Hugging Face.'
      );

      return {
        success: true,
        message: 'Connexion à l\'API réussie',
        details: { response: testResult }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur de connexion: ${error.message}`,
        details: { error }
      };
    }
  }
}
