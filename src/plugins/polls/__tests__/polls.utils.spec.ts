import { describe, it, expect } from 'vitest';
import { extractPollData, processPollOptions } from '../polls.utils';

function mockPollMessage(metadata: unknown) {
  return { getMetadata: () => metadata, getId: () => 999 } as any;
}

describe('extractPollData', () => {
  it('extracts poll data from valid metadata', () => {
    const msg = mockPollMessage({
      '@injected': {
        extensions: {
          polls: {
            id: 'p1',
            question: 'Q?',
            options: { '1': 'A' },
            results: { total: 1, options: { '1': { count: 1, voters: {} } } },
          },
        },
      },
    });
    const data = extractPollData(msg);
    expect(data).not.toBeNull();
    expect(data!.question).toBe('Q?');
    expect(data!.id).toBe('p1');
  });

  it('returns null for null message', () => {
    expect(extractPollData(null as any)).toBeNull();
  });

  it('returns null for missing metadata', () => {
    expect(extractPollData({ getMetadata: () => null, getId: () => 1 } as any)).toBeNull();
  });

  it('returns null for missing @injected', () => {
    expect(extractPollData(mockPollMessage({}))).toBeNull();
  });

  it('returns null for missing extensions', () => {
    expect(extractPollData(mockPollMessage({ '@injected': {} }))).toBeNull();
  });

  it('returns null for missing polls key', () => {
    expect(extractPollData(mockPollMessage({ '@injected': { extensions: {} } }))).toBeNull();
  });

  it('falls back to message ID when poll id is missing', () => {
    const msg = mockPollMessage({
      '@injected': {
        extensions: { polls: { question: 'Q?', options: {}, results: { total: 0, options: {} } } },
      },
    });
    const data = extractPollData(msg);
    expect(data!.id).toBe(999);
  });
});

describe('processPollOptions', () => {
  it('calculates percentages correctly', () => {
    const data = {
      id: '1',
      question: 'Q',
      options: { '1': 'A', '2': 'B' },
      results: {
        total: 4,
        options: { '1': { count: 3, voters: {} }, '2': { count: 1, voters: {} } },
      },
    };
    const opts = processPollOptions(data);
    expect(opts[0].percent).toBe('75%');
    expect(opts[1].percent).toBe('25%');
  });

  it('handles zero total votes', () => {
    const data = {
      id: '1',
      question: 'Q',
      options: { '1': 'A' },
      results: { total: 0, options: { '1': { count: 0, voters: {} } } },
    };
    const opts = processPollOptions(data);
    expect(opts[0].percent).toBe('0%');
  });

  it('detects selectedByLoggedInUser', () => {
    const data = {
      id: '1',
      question: 'Q',
      options: { '1': 'A' },
      results: { total: 1, options: { '1': { count: 1, voters: { 'uid-1': { name: 'Alice' } } } } },
    };
    const opts = processPollOptions(data, 'uid-1');
    expect(opts[0].selectedByLoggedInUser).toBe(true);
  });

  it('limits voters to 3', () => {
    const voters: Record<string, { name: string }> = {};
    for (let i = 0; i < 5; i++) voters[`u${String(i)}`] = { name: `User ${String(i)}` };
    const data = {
      id: '1',
      question: 'Q',
      options: { '1': 'A' },
      results: { total: 5, options: { '1': { count: 5, voters } } },
    };
    const opts = processPollOptions(data);
    expect(opts[0].voters.length).toBe(3);
  });
});
