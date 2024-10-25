const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');
require('dotenv').config();

// Clé de chiffrement
const SECRET_KEY = process.env.SECRET_KEY;

// Dossier de départ et dossier de sortie
const inputFolderPath = './public/js/';
const outputFolderPath = './encrypted-js/';

// Fonction pour parcourir tous les fichiers JS dans les sous-dossiers
function encryptFilesRecursively(currentPath, outputPath) {
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    fs.readdirSync(currentPath).forEach(file => {
        const inputFilePath = path.join(currentPath, file);
        const outputFilePath = path.join(outputPath, file.endsWith('.js') ? `${file}.enc.js` : file);

        if (fs.statSync(inputFilePath).isDirectory()) {
            // Appel récursif pour les sous-dossiers
            encryptFilesRecursively(inputFilePath, outputFilePath);
        } else if (file.endsWith('.js')) {
            const code = fs.readFileSync(inputFilePath, 'utf8');

            // Chiffrement du code
            const encryptedCode = CryptoJS.AES.encrypt(code, SECRET_KEY).toString();
            const finalCode = `var encryptedCode = "${encryptedCode}";`;

            fs.writeFileSync(outputFilePath, finalCode, 'utf8');
            console.log(`Le fichier ${inputFilePath} a été chiffré avec succès.`);
        }
    });
}

// Lancer le chiffrement sur le dossier spécifié
encryptFilesRecursively(inputFolderPath, outputFolderPath);
