import fs from 'fs';
import path from 'path';
import { HAIRSTYLE_CATALOG } from '../src/features/recommendations/domain/hairstyle-catalog';

// Base64 for a tiny 1x1 solid gray JPEG
const TINY_JPEG_BASE64 = 
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function run() {
  const publicHairstylesDir = path.join(process.cwd(), 'public', 'hairstyles');

  // Ensure directory exists
  if (!fs.existsSync(publicHairstylesDir)) {
    fs.mkdirSync(publicHairstylesDir, { recursive: true });
  }

  const jpegBuffer = Buffer.from(TINY_JPEG_BASE64, 'base64');
  console.log('Generating placeholders for all catalog hairstyles...');

  let count = 0;
  for (const style of HAIRSTYLE_CATALOG) {
    const filename = path.basename(style.imageUrl);
    const filePath = path.join(publicHairstylesDir, filename);

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, jpegBuffer);
      console.log(`  - Generated: ${filename}`);
      count++;
    }
  }

  console.log(`\nPlaceholder generation complete. Generated ${count} new files.`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
