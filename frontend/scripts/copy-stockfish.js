const fs = require('fs');
const path = require('path');

const candidates = [
    path.join(__dirname, '../node_modules/stockfish.js'),
    path.join(__dirname, '../node_modules/stockfish/src'),
    path.join(__dirname, '../node_modules/stockfish'),
];

const dest = path.join(__dirname, '../public');

let found = false;
for (const srcDir of candidates) {
    if (fs.existsSync(srcDir)) {
        const files = fs.readdirSync(srcDir).filter(f => f.startsWith('stockfish'));
        if (files.length > 0) {
            files.forEach(file => {
                fs.copyFileSync(path.join(srcDir, file), path.join(dest, file));
                console.log(`✓ Copied ${file} to public/`);
            });
            found = true;
            break;
        }
    }
}

if (!found) {
    console.log('⚠ stockfish files not found in node_modules — run: npm install');
    process.exit(1);
}
process.exit(0);