import sys
from transformers import pipeline

def main(pdf_text):
    # Charger le modèle pré-entraîné pour l'extraction de texte
    summarizer = pipeline("summarization")

    # Processus de résumé
    summary = summarizer(pdf_text, max_length=300, min_length=30, do_sample=False)

    print(summary[0]['summary_text'])

if __name__ == "__main__":
    # Récupérer le texte PDF depuis les arguments de ligne de commande
    pdf_text = sys.argv[1]
    main(pdf_text)
