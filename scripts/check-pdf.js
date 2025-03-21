const fs = require('fs');
const path = require('path');

const PDF_PATH = path.join(__dirname, '..', 'pdfs', 'canon_avicenna.pdf');

function checkPDF() {
  try {
    const stats = fs.statSync(PDF_PATH);
    const fileSizeInBytes = stats.size;
    // Un fichier Git LFS pointer fait généralement moins de 1Ko
    if (fileSizeInBytes < 1024) {
      console.error('ATTENTION: Le fichier PDF semble être un pointeur Git LFS.');
      console.error('Exécutez "git lfs pull" pour télécharger le vrai fichier.');
      process.exit(1);
    } else {
      console.log('PDF vérifié avec succès !');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du PDF:', error);
    process.exit(1);
  }
}

checkPDF(); 