const fs = require('fs');
const path = require('path');

const langs = ['es', 'en', 'fr', 'pt'];
const dir = path.join(__dirname, 'src', 'translations');

for (const lang of langs) {
  const filePath = path.join(dir, lang + '.js');
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace('Cancela cuando quieras."\\n\\n    // Profile', 'Cancela cuando quieras.",\\n\\n    // Profile');
  content = content.replace('Cancel anytime."\\n\\n    // Profile', 'Cancel anytime.",\\n\\n    // Profile');
  content = content.replace('Annulez quand vous voulez."\\n\\n    // Profile', 'Annulez quand vous voulez.",\\n\\n    // Profile');
  content = content.replace('Sem Fidelidade."\\n\\n    // Profile', 'Sem Fidelidade.",\\n\\n    // Profile');
  content = content.replace(/Cancela cuando quieras."\\n\\n    \\/\\/ Profile/, 'Cancela cuando quieras.",\\n\\n    // Profile');
  content = content.replace(/Cancel anytime."\\n\\n    \\/\\/ Profile/, 'Cancel anytime.",\\n\\n    // Profile');
  content = content.replace(/Annulez quand vous voulez."\\n\\n    \\/\\/ Profile/, 'Annulez quand vous voulez.",\\n\\n    // Profile');
  content = content.replace(/Sem Fidelidade."\\n\\n    \\/\\/ Profile/, 'Sem Fidelidade.",\\n\\n    // Profile');
  
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Commas fixed!');
