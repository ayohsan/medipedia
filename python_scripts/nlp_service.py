import sys
from transformers import pipeline

def chunk_text(text, max_chunk_size=500):
    # Découpe le texte en phrases
    sentences = text.split('.')
    chunks = []
    current_chunk = []
    current_size = 0
    
    for sentence in sentences:
        if current_size + len(sentence) > max_chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]
            current_size = len(sentence)
        else:
            current_chunk.append(sentence)
            current_size += len(sentence)
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    return chunks

def main(pdf_text):
    try:
        # Initialiser le modèle avec un modèle français
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=0)
        
        # Découper le texte en morceaux gérables
        chunks = chunk_text(pdf_text)
        
        # Résumer chaque morceau
        summaries = []
        for chunk in chunks:
            if len(chunk.strip()) > 50:  # Ignorer les chunks trop petits
                summary = summarizer(chunk, max_length=130, min_length=30, do_sample=False)
                summaries.append(summary[0]['summary_text'])
        
        # Combiner les résumés
        final_summary = ' '.join(summaries)
        print(final_summary)
        
    except Exception as e:
        print(f"Erreur lors du résumé : {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Erreur : Texte manquant", file=sys.stderr)
        sys.exit(1)
    
    pdf_text = sys.argv[1]
    main(pdf_text)
