const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'fr', 'pt'];
const dir = path.join(__dirname, 'src', 'translations');

for (const lang of langs) {
  const filePath = path.join(dir, lang + '.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the quote parsing
  content = content.replace(/corazón también\.\\",\n/g, 'corazón también.\\"",\n');
  content = content.replace(/heart too\.\\",\n/g, 'heart too.\\"",\n');
  content = content.replace(/votre cœur aussi\.\\",\n/g, 'votre cœur aussi.\\"",\n');
  content = content.replace(/seu coração também\.\\",\n/g, 'seu coração também.\\"",\n');
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed about.quote quotes!');
