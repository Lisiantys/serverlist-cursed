const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');
require('dotenv').config();

// Clé de déchiffrement
const SECRET_KEY = process.env.SECRET_KEY;

// Dossier d'entrée des fichiers chiffrés et dossier de sortie
const inputFolderPath = './encrypted-js/';
const outputFolderPath = './public/js/';

// Fonction pour parcourir et déchiffrer les fichiers dans les sous-dossiers
function decryptFilesRecursively(currentPath, outputPath) {
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    fs.readdirSync(currentPath).forEach(file => {
        const inputFilePath = path.join(currentPath, file);
        const outputFilePath = path.join(outputPath, file.replace('.enc.js', ''));

        if (fs.statSync(inputFilePath).isDirectory()) {
            // Appel récursif pour les sous-dossiers
            decryptFilesRecursively(inputFilePath, outputFilePath);
        } else if (file.endsWith('.enc.js')) {
            const encryptedData = fs.readFileSync(inputFilePath, 'utf8');

            // Extraire et déchiffrer la variable encryptedCode
            const encryptedCodeMatch = encryptedData.match(/var encryptedCode = "(.*)";/);
            if (!encryptedCodeMatch || encryptedCodeMatch.length < 2) {
                console.error(`Erreur : encryptedCode non trouvé dans ${inputFilePath}.`);
                return;
            }

            const encryptedCode = encryptedCodeMatch[1];
            const decryptedBytes = CryptoJS.AES.decrypt(encryptedCode, SECRET_KEY);
            const decryptedCode = decryptedBytes.toString(CryptoJS.enc.Utf8);

            fs.writeFileSync(outputFilePath, decryptedCode, 'utf8');
            console.log(`Le fichier ${inputFilePath} a été déchiffré avec succès.`);
        }
    });
}

// Lancer le déchiffrement sur le dossier spécifié
decryptFilesRecursively(inputFolderPath, outputFolderPath);
