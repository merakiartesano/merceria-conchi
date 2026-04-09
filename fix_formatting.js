const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'fr', 'pt'];
const dir = path.join(__dirname, 'src', 'translations');

for (const lang of langs) {
  const filePath = path.join(dir, lang + '.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace literal '\n' characters that were mistakenly injected
  content = content.replace(/\\n\\n {4}\/\/ Profile/g, '",\n\n    // Profile');
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed literal slash-n strings!');
