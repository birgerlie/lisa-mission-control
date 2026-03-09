import { cn } from './classUtils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active');
    expect(cn('base', false && 'hidden')).toBe('base');
  });

  it('handles object syntax', () => {
    expect(cn({ active: true, hidden: false })).toBe('active');
  });

  it('handles array syntax', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('filters out falsy values', () => {
    expect(cn('base', null, undefined, false, '', 'active')).toBe('base active');
  });
});
