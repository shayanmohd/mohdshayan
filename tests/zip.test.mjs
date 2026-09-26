import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, zipStore, uniqueNames, formatBytes, fitWithin } from '../assets/tools/lib/zip.js';

test('zip: crc32 matches the reference value', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});
test('zip: archives open in a standard unzipper with names and bytes intact', t => {
  let python = true;
  try { execFileSync('python3', ['--version']); } catch { python = false; }
  if (!python) return t.skip('python3 is not available');
  const files = [
    { name: 'photo.webp', data: Uint8Array.from({ length: 5000 }, (_, i) => (i * 7) % 256) },
    { name: 'photo.webp', data: new TextEncoder().encode('second file, same name') },
    { name: 'café screenshot.png', data: new Uint8Array(0) },
  ];
  const dir = mkdtempSync(join(tmpdir(), 'ziptest-'));
  try {
    const path = join(dir, 'out.zip');
    writeFileSync(path, zipStore(files, new Date(2026, 8, 26, 14, 30, 10)));
    const report = JSON.parse(execFileSync('python3', ['-c', `
import zipfile, json, sys, hashlib
z = zipfile.ZipFile(sys.argv[1])
bad = z.testzip()
print(json.dumps({"bad": bad, "files": [[i.filename, i.file_size, hashlib.sha1(z.read(i)).hexdigest(), list(i.date_time)] for i in z.infolist()]}))
`, path]).toString());
    assert.equal(report.bad, null);
    assert.deepEqual(report.files.map(f => f[0]), ['photo.webp', 'photo (2).webp', 'café screenshot.png']);
    assert.deepEqual(report.files.map(f => f[1]), [5000, 22, 0]);
    assert.deepEqual(report.files[0][3], [2026, 9, 26, 14, 30, 10]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('zip: helpers', () => {
  assert.deepEqual(uniqueNames(['a.jpg', 'A.jpg', 'a.jpg', 'b']), ['a.jpg', 'A (2).jpg', 'a (3).jpg', 'b']);
  assert.equal(formatBytes(900), '900 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(612 * 1024), '612 KB');
  assert.equal(formatBytes(2.4 * 1048576), '2.40 MB');
  assert.deepEqual(fitWithin(4032, 3024, 1920), { width: 1920, height: 1440 });
  assert.deepEqual(fitWithin(800, 600, 1920), { width: 800, height: 600 });
  assert.deepEqual(fitWithin(800, 600, 0), { width: 800, height: 600 });
});
