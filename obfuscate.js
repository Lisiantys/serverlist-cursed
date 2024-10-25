// obfuscate.js
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Chemin d'entrée (dossier contenant les fichiers JS à obfusquer)
const inputDir = path.join(__dirname, 'public/js');

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

// Fonction récursive pour parcourir les dossiers et obfusquer chaque fichier JS
function obfuscateDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Appel récursif si le fichier est un dossier
            obfuscateDirectory(fullPath);
        } else if (stat.isFile() && path.extname(fullPath) === '.js') {
            // Obfuscation si le fichier est un fichier JS
            const code = fs.readFileSync(fullPath, 'utf8');
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscationOptions).getObfuscatedCode();

            // Remplacer le fichier original par le fichier obfusqué
            fs.writeFileSync(fullPath, obfuscatedCode, 'utf8');
            console.log(`Fichier obfusqué : ${fullPath}`);
        }
    });
}

// Démarrer l'obfuscation du dossier spécifié
obfuscateDirectory(inputDir);
console.log('Tous les fichiers JavaScript ont été obfusqués.');
