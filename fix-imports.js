import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

const aliases = {
  '@/': 'src/',
  '@components/': 'src/components/',
  '@context/': 'src/context/',
  '@services/': 'src/services/',
  '@hooks/': 'src/hooks/',
  '@screens/': 'src/screens/',
  '@utils/': 'src/utils/',
  '@types/': 'src/types/',
};

async function fixImports() {
  const files = await glob('src/**/*.{ts,tsx}');

  for (const file of files) {
    let content = await fs.readFile(file, 'utf-8');
    const fileDir = path.dirname(file);
    let changed = false;

    for (const [alias, aliasPath] of Object.entries(aliases)) {
      const regex = new RegExp(`(import .* from ')${alias}(.*)(')`, 'g');
      content = content.replace(regex, (match, p1, p2, p3) => {
        const targetPath = path.join(aliasPath, p2);
        const relativePath = path.relative(fileDir, targetPath).replace(/\\/g, '/');
        changed = true;
        return `${p1}./${relativePath}${p3}`;
      });
    }

    if (changed) {
      await fs.writeFile(file, content, 'utf-8');
      console.log(`Fixed imports in: ${file}`);
    }
  }
}

fixImports().catch(console.error);
