const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'fr', 'pt'];
const dir = path.join(__dirname, 'src', 'translations');

for (const lang of langs) {
  const filePath = path.join(dir, lang + '.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the double quote before comma
  content = content.replace(/""\,\n/g, '",\n');
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed double quotes!');
