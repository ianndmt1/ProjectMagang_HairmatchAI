import fs from 'fs';
import path from 'path';
import { HAIRSTYLE_CATALOG } from '../src/features/recommendations/domain/hairstyle-catalog';

async function run() {
  const publicHairstylesDir = path.join(process.cwd(), 'public', 'hairstyles');

  console.log('--- AUTOMATED HAIRSTYLE CATALOG AUDIT ---');
  console.log(`Total imageUrl in catalog: ${HAIRSTYLE_CATALOG.length}`);

  let existingCount = 0;
  let missingCount = 0;

  const missingFiles: string[] = [];
  const existingFiles: string[] = [];

  for (const style of HAIRSTYLE_CATALOG) {
    const imageUrl = style.imageUrl;
    // Extract filename from e.g., /hairstyles/classic-side-part.jpg
    const filename = path.basename(imageUrl);
    const filePath = path.join(publicHairstylesDir, filename);

    if (fs.existsSync(filePath)) {
      existingCount++;
      existingFiles.push(filename);
    } else {
      missingCount++;
      missingFiles.push(filename);
    }
  }

  console.log(`\nExisting files in public/hairstyles: ${existingCount}`);
  existingFiles.forEach(f => console.log(`  - [EXISTS] ${f}`));

  console.log(`\nMissing files: ${missingCount}`);
  missingFiles.forEach(f => console.log(`  - [MISSING] ${f}`));

  // Check for physical files that are not in the catalog (excluding placeholder)
  if (fs.existsSync(publicHairstylesDir)) {
    const files = fs.readdirSync(publicHairstylesDir);
    const catalogFilenames = new Set(HAIRSTYLE_CATALOG.map(s => path.basename(s.imageUrl)));

    const extraFiles = files.filter(f => f !== 'placeholder.svg' && !catalogFilenames.has(f));
    if (extraFiles.length > 0) {
      console.log(`\nUnused physical files: ${extraFiles.length}`);
      extraFiles.forEach(f => console.log(`  - [UNUSED] ${f}`));
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
