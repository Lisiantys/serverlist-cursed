// obfuscate.js
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Chemin d'entrée (dossier contenant les fichiers JS à obfusquer)
const inputDir = path.join(__dirname, 'public/js');
// Chemin de sortie (dossier pour les fichiers obfusqués)
const outputDir = path.join(__dirname, 'public/js-obf');

// Options d'obfuscation
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    stringArray: true,
    stringArrayThreshold: 0.75,
    splitStrings: true,
    splitStringsChunkLength: 5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: 5000,
    disableConsoleOutput: true
};

// Fonction récursive pour parcourir les dossiers, copier les fichiers et obfusquer les fichiers JS
function obfuscateDirectory(inputDir, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.readdirSync(inputDir).forEach(file => {
        const inputFullPath = path.join(inputDir, file);
        const outputFullPath = path.join(outputDir, file);
        const stat = fs.statSync(inputFullPath);

        if (stat.isDirectory()) {
            // Appel récursif si le fichier est un dossier
            obfuscateDirectory(inputFullPath, outputFullPath);
        } else if (stat.isFile()) {
            if (path.extname(inputFullPath) === '.js') {
                // Obfuscation si le fichier est un fichier JS
                const code = fs.readFileSync(inputFullPath, 'utf8');
                const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscationOptions).getObfuscatedCode();

                // Écrire le fichier obfusqué dans le dossier de sortie
                fs.writeFileSync(outputFullPath, obfuscatedCode, 'utf8');
                console.log(`Fichier obfusqué : ${outputFullPath}`);
            } else {
                // Copier le fichier tel quel
                fs.copyFileSync(inputFullPath, outputFullPath);
                console.log(`Fichier copié : ${outputFullPath}`);
            }
        }
    });
}

// Démarrer l'obfuscation du dossier spécifié
obfuscateDirectory(inputDir, outputDir);
console.log('Tous les fichiers JavaScript ont été obfusqués dans le dossier js-obf.');
