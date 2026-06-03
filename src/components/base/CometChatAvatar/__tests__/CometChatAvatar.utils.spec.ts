import { describe, it, expect } from 'vitest';
import { getInitials } from '../CometChatAvatar.utils';

describe('getInitials', () => {
  it('returns "JD" for "John Doe"', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns "AB" for "Alice Bob Charlie"', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB');
  });

  it('returns "AD" for "Admin"', () => {
    expect(getInitials('Admin')).toBe('AD');
  });

  it('returns "A" for "A"', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('returns "" for ""', () => {
    expect(getInitials('')).toBe('');
  });

  it('handles extra whitespace', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
  });

  it('returns "" for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('');
  });
});
