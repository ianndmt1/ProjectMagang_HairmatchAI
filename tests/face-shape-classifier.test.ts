import test from 'node:test';
import assert from 'node:assert/strict';
import { FaceShapeClassifier } from '../src/features/face-analysis/domain/classifier';

const classifier = new FaceShapeClassifier();

test('FaceShapeClassifier classifies balanced long measurements as oval', () => {
  const { result } = classifier.classify({
    face_length: 125,
    forehead_width: 100,
    cheekbone_width: 100,
    jaw_width: 95,
  });

  assert.equal(result.face_shape, 'oval');
  assert.ok(result.confidence_score > 0);
  assert.equal(result.metrics.face_length, 125);
});

test('FaceShapeClassifier classifies dominant jaw measurements as triangle', () => {
  const { result } = classifier.classify({
    face_length: 120,
    forehead_width: 78,
    cheekbone_width: 100,
    jaw_width: 108,
  });

  assert.equal(result.face_shape, 'triangle');
  assert.ok(result.confidence_score >= 0 && result.confidence_score <= 100);
});

test('FaceShapeClassifier keeps confidence in the 0..100 range for ambiguous input', () => {
  const { result } = classifier.classify({
    face_length: 100,
    forehead_width: 100,
    cheekbone_width: 100,
    jaw_width: 100,
  });

  assert.ok(result.confidence_score >= 0);
  assert.ok(result.confidence_score <= 100);
});
