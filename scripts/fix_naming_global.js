const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/91932/gmca-ui';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory && !f.startsWith('.') && f !== 'node_modules') {
            walk(dirPath, callback);
        } else if (!isDirectory) {
            callback(path.join(dir, f));
        }
    });
}

walk(directory, (file) => {
    if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.sql')) {
        let content = fs.readFileSync(file, 'utf8');
        if (content.includes('organisation_type_name')) {
            console.log('Fixing:', file);
            let newContent = content.replace(/organisation_type_name/g, 'organisation_type');
            fs.writeFileSync(file, newContent, 'utf8');
        }
    }
});
