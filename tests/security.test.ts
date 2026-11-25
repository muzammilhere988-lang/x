import {describe, expect, it} from 'bun:test';
import {
  isPrivateOrLoopbackHost,
  isValidUuid,
  sanitizeImageSrc,
  validateExternalImageUrl,
  validateMonetaryPrice,
  validatePublicMenuUrl,
} from '../src/utils/formatters';
import {getFriendlyErrorMessage} from '../src/lib/supabase';
import {validateImageFileBytes} from '../src/lib/storage';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  saveBusinessSettings,
  updateCategory,
  updateProduct,
} from '../src/lib/menuApi';

describe('Security Validators & Sanitizers', () => {
  it('blocks dangerous schemes and protocol-relative URLs in sanitizeImageSrc', () => {
    expect(sanitizeImageSrc('javascript:alert(1)')).toBeNull();
    expect(sanitizeImageSrc('JAVASCRIPT:alert(document.cookie)')).toBeNull();
    expect(sanitizeImageSrc('data:image/svg+xml,<svg onload=alert(1)>')).toBeNull();
    expect(sanitizeImageSrc('vbscript:msgbox(1)')).toBeNull();
    expect(sanitizeImageSrc('//evil.example/payload.png')).toBeNull();
    expect(sanitizeImageSrc('no-image')).toBeNull();
    expect(sanitizeImageSrc('')).toBeNull();
    expect(sanitizeImageSrc('blob:https://qrsystemme.netlify.app/123')).toBeNull();
    expect(sanitizeImageSrc('blob:https://qrsystemme.netlify.app/123', {allowBlob: true})).toBe(
      'blob:https://qrsystemme.netlify.app/123'
    );
    expect(sanitizeImageSrc('/assets/aistudio/sample.jpeg')).toBe('/assets/aistudio/sample.jpeg');
    expect(sanitizeImageSrc('https://i.pinimg.com/originals/test.jpg')).toBe(
      'https://i.pinimg.com/originals/test.jpg'
    );
  });

  it('rejects private/loopback/metadata hosts and embedded credentials in validateExternalImageUrl', () => {
    expect(validateExternalImageUrl('http://169.254.169.254/latest/meta-data/').valid).toBe(false);
    expect(validateExternalImageUrl('http://127.0.0.1:8080/secret.png').valid).toBe(false);
    expect(validateExternalImageUrl('http://localhost/admin.png').valid).toBe(false);
    expect(validateExternalImageUrl('http://192.168.1.10/cam.jpg').valid).toBe(false);
    expect(validateExternalImageUrl('http://10.0.0.5/internal.png').valid).toBe(false);
    expect(validateExternalImageUrl('https://user:pass@i.pinimg.com/photo.jpg').valid).toBe(false);
    expect(validateExternalImageUrl('javascript:alert(1)').valid).toBe(false);
    expect(validateExternalImageUrl('data:text/html,<script>alert(1)</script>').valid).toBe(false);

    const validResult = validateExternalImageUrl('https://i.pinimg.com/736x/wrap.jpg');
    expect(validResult.valid).toBe(true);
    expect(validResult.normalized).toBe('https://i.pinimg.com/736x/wrap.jpg');
  });

  it('detects private and loopback hostnames accurately', () => {
    expect(isPrivateOrLoopbackHost('localhost')).toBe(true);
    expect(isPrivateOrLoopbackHost('127.0.0.1')).toBe(true);
    expect(isPrivateOrLoopbackHost('169.254.169.254')).toBe(true);
    expect(isPrivateOrLoopbackHost('172.16.0.1')).toBe(true);
    expect(isPrivateOrLoopbackHost('172.31.255.255')).toBe(true);
    expect(isPrivateOrLoopbackHost('::1')).toBe(true);
    expect(isPrivateOrLoopbackHost('service.internal')).toBe(true);
    expect(isPrivateOrLoopbackHost('qrsystemme.netlify.app')).toBe(false);
  });

  it('rejects javascript/data schemes, embedded creds, and AI Studio links in validatePublicMenuUrl', () => {
    expect(validatePublicMenuUrl('javascript:alert(1)').valid).toBe(false);
    expect(validatePublicMenuUrl('data:text/html,xss').valid).toBe(false);
    expect(validatePublicMenuUrl('https://admin:secret@qrsystemme.netlify.app/menu').valid).toBe(false);
    expect(validatePublicMenuUrl('https://ai.studio/apps/123').valid).toBe(false);
    expect(validatePublicMenuUrl('https://qrsystemme.netlify.app/menu').valid).toBe(true);
  });

  it('rejects negative, NaN, Infinity, and oversized monetary prices', () => {
    expect(validateMonetaryPrice('-10').valid).toBe(false);
    expect(validateMonetaryPrice('NaN').valid).toBe(false);
    expect(validateMonetaryPrice('Infinity').valid).toBe(false);
    expect(validateMonetaryPrice('10000000').valid).toBe(false);
    expect(validateMonetaryPrice('140.555')).toEqual({valid: true, value: 140.56});
  });

  it('validates UUID v1-v5 format strictly', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid("'; DROP TABLE products;--")).toBe(false);
    expect(isValidUuid('not-a-uuid')).toBe(false);
  });

  it('never leaks raw database/internal error details via getFriendlyErrorMessage', () => {
    const rawDbErr = {
      message: 'permission denied for table admin_profiles policy "Admin can read own profile"',
    };
    const msg = getFriendlyErrorMessage(rawDbErr, 'Operation failed.');
    expect(msg).toBe('Operation failed.');
    expect(msg).not.toContain('admin_profiles');

    const rlsErr = {code: '42501', message: 'new row violates row-level security policy'};
    expect(getFriendlyErrorMessage(rlsErr, 'Fallback')).toBe(
      'Permission denied by database security policy. Please sign in as the authorized administrator.'
    );
  });

  it('verifies image magic bytes rather than trusting MIME type alone', async () => {
    const fakePng = new File(['<svg onload=alert(1)></svg>'], 'evil.png', {type: 'image/png'});
    const fakeResult = await validateImageFileBytes(fakePng);
    expect(fakeResult.valid).toBe(false);

    const realPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const realPng = new File([realPngBytes], 'logo.png', {type: 'image/png'});
    const realResult = await validateImageFileBytes(realPng);
    expect(realResult.valid).toBe(true);

    const realJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const realJpeg = new File([realJpegBytes], 'wrap.jpg', {type: 'image/jpeg'});
    expect((await validateImageFileBytes(realJpeg)).valid).toBe(true);
  });

  it('fails closed in menuApi when Supabase is unconfigured or inputs are invalid', async () => {
    await expect(createCategory({name: '', display_order: 0, is_active: true})).rejects.toThrow();
    await expect(updateCategory('bad-id', {name: 'Wraps'})).rejects.toThrow();
    await expect(deleteCategory('bad-id')).rejects.toThrow();
    await expect(
      createProduct({
        name: 'Test',
        admin_notes: null,
        image_path: '../etc/passwd',
        image_url: 'javascript:alert(1)',
        price: -5,
        category_id: 'bad-id',
        is_active: true,
        is_available: true,
      })
    ).rejects.toThrow();
    await expect(updateProduct('bad-id', {price: -1})).rejects.toThrow();
    await expect(deleteProduct('bad-id')).rejects.toThrow();
    await expect(
      saveBusinessSettings('bad-id', {
        business_name: 'Test',
        business_logo: null,
        business_logo_path: null,
        menu_heading: 'Menu',
        currency_symbol: '₹',
        menu_theme: 'warm-ivory',
        public_menu_url: 'javascript:alert(1)',
      })
    ).rejects.toThrow();
  });
});
