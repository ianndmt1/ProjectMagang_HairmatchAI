import test from 'node:test';
import assert from 'node:assert/strict';
import { SimplePhotoQualityValidator } from '../src/features/face-analysis/infrastructure/validators/simple-photo-quality-validator';

test('PhotoQualityValidator accepts a valid image URL and image content type', async () => {
  const validator = new SimplePhotoQualityValidator();

  const result = await validator.validate({
    photoUrl: 'https://example.com/uploads/customer-face.webp',
    fileType: 'image/webp',
    fileSizeBytes: 500 * 1024,
  });

  assert.equal(result.ok, true);
  assert.ok(result.quality.score > 0);
});

test('PhotoQualityValidator rejects non-image content types', async () => {
  const validator = new SimplePhotoQualityValidator();

  const result = await validator.validate({
    photoUrl: 'https://example.com/uploads/customer-face.jpg',
    fileType: 'application/pdf',
  });

  assert.equal(result.ok, false);
  assert.equal(result.quality.notes, 'Bukan tipe gambar');
});

test('PhotoQualityValidator rejects URLs without an image extension', async () => {
  const validator = new SimplePhotoQualityValidator();

  const result = await validator.validate({
    photoUrl: 'https://example.com/uploads/customer-face',
  });

  assert.equal(result.ok, false);
  assert.match(result.quality.notes ?? '', /file gambar/);
});
