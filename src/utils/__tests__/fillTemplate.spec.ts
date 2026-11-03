import { describe, it, expect } from 'vitest';
import { fillTemplate } from '../fillTemplate';

describe('fillTemplate', () => {
  it('fills every placeholder', () => {
    expect(fillTemplate('{actor} made {member} {scope}', { actor: 'Alice', member: 'Bob', scope: 'Admin' })).toBe(
      'Alice made Bob Admin'
    );
  });

  it('fills a placeholder each time it appears', () => {
    expect(fillTemplate('{name}, {name}!', { name: 'Ada' })).toBe('Ada, Ada!');
  });

  it('inserts numbers as text', () => {
    expect(fillTemplate('{count} replies', { count: 3 })).toBe('3 replies');
  });

  it.each(['$&', '$`', "$'", '$$', '$1', "Al$&ice $`x$'y$$z"])('keeps %s in a value as typed', value => {
    expect(fillTemplate('Hello {name}', { name: value })).toBe(`Hello ${value}`);
  });

  it("never fills a placeholder that a value brings in", () => {
    expect(fillTemplate('{actor} kicked {member}', { actor: '{member}', member: 'Carl' })).toBe('{member} kicked Carl');
  });

  it('leaves a placeholder with no value as written', () => {
    expect(fillTemplate('{name} reacted with {emoji}', { name: 'Ada' })).toBe('Ada reacted with {emoji}');
  });

  it('removes a placeholder whose value is empty', () => {
    expect(fillTemplate('Up to {count} files', { count: '' })).toBe('Up to  files');
  });
});
