import { describe, it, expect } from 'vitest';
import { validatePhoto } from './cloudinary';

function makeFile(name, type, size = 1024) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('validatePhoto', () => {
  it('accepts a JPG', () => {
    expect(() => validatePhoto(makeFile('a.jpg', 'image/jpeg'))).not.toThrow();
  });

  it('accepts a PNG', () => {
    expect(() => validatePhoto(makeFile('a.png', 'image/png'))).not.toThrow();
  });

  it('accepts a WebP', () => {
    expect(() => validatePhoto(makeFile('a.webp', 'image/webp'))).not.toThrow();
  });

  it('rejects a GIF', () => {
    expect(() => validatePhoto(makeFile('a.gif', 'image/gif'))).toThrow();
  });

  it('rejects a PDF', () => {
    expect(() => validatePhoto(makeFile('a.pdf', 'application/pdf'))).toThrow();
  });

  it('rejects a file over 10 MB', () => {
    const tooBig = 10 * 1024 * 1024 + 1;
    expect(() =>
      validatePhoto(makeFile('big.jpg', 'image/jpeg', tooBig))
    ).toThrow();
  });

  it('accepts a file of exactly 10 MB', () => {
    const limit = 10 * 1024 * 1024;
    expect(() =>
      validatePhoto(makeFile('edge.jpg', 'image/jpeg', limit))
    ).not.toThrow();
  });
});