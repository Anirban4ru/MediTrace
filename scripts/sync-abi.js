const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, '../artifacts/contracts/MedicineTracker.sol/MedicineTracker.json');
const outputPath = path.join(__dirname, '../lib/abi.ts');

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

const fileContent = `export const MedicineTrackerABI = ${JSON.stringify(artifact.abi, null, 2)};\n`;

fs.writeFileSync(outputPath, fileContent, 'utf8');
console.log('ABI synchronized to lib/abi.ts');
