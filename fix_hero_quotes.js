const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'fr', 'pt'];
const dir = path.join(__dirname, 'src', 'translations');

for (const lang of langs) {
  const filePath = path.join(dir, lang + '.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the previously corrupted empty string
  content = content.replace(/"hero\.desc": ",\n/g, '"hero.desc": "",\n');
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed hero.desc quotes!');
