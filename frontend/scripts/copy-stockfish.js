const fs = require('fs');
const path = require('path');

const candidates = [
    path.join(__dirname, '../node_modules/stockfish/src/stockfish.js'),
    path.join(__dirname, '../node_modules/stockfish/stockfish.js'),
];

const dest = path.join(__dirname, '../public/stockfish.js');

for (const src of candidates) {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Copied stockfish.js to public/`);
        process.exit(0);
    }
}
console.log('⚠ stockfish.js not found in node_modules — run: npm install');