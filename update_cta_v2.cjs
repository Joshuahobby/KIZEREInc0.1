const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'client', 'src', 'lib', 'i18n', 'locales');
const files = ['en.json', 'rw.json', 'fr.json', 'sw.json'];

const updates = {
  'en.json': {
    heroCtaButton: "See the Process",
    ctaButton: "Protect Your Item"
  },
  'rw.json': {
    heroCtaButton: "Reba Uko Bikora",
    ctaButton: "Rinda Ikintu Cyawe"
  },
  'fr.json': {
    heroCtaButton: "Voir le processus",
    ctaButton: "Protéger votre objet"
  },
  'sw.json': {
    heroCtaButton: "Angalia Mchakato",
    ctaButton: "Linda Kitu Chako"
  }
};

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (content.howItWorksPage) {
      content.howItWorksPage.heroCtaButton = updates[file].heroCtaButton;
      content.howItWorksPage.ctaButton = updates[file].ctaButton;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`howItWorksPage not found in ${file}`);
    }
  }
});
