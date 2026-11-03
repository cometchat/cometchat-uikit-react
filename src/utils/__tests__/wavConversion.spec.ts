import { describe, it, expect, vi, afterEach } from 'vitest';
import { convertToWav, encodeWav } from '../wavConversion';

function readAscii(view: DataView, offset: number, length: number): string {
  let text = '';
  for (let i = 0; i < length; i++) {
    text += String.fromCharCode(view.getUint8(offset + i));
  }
  return text;
}

describe('encodeWav', () => {
  it('writes a 16-bit mono PCM WAV header', () => {
    const view = new DataView(encodeWav(new Float32Array(16000), 16000));

    expect(readAscii(view, 0, 4)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + 32000); // RIFF chunk size
    expect(readAscii(view, 8, 4)).toBe('WAVE');
    expect(readAscii(view, 12, 4)).toBe('fmt ');
    expect(view.getUint32(16, true)).toBe(16); // fmt chunk size
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint32(28, true)).toBe(32000); // byte rate
    expect(view.getUint16(32, true)).toBe(2); // block align
    expect(view.getUint16(34, true)).toBe(16);
    expect(readAscii(view, 36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(32000);
    expect(view.byteLength).toBe(44 + 32000);
  });

  it('scales and clamps samples to 16-bit', () => {
    const view = new DataView(encodeWav(new Float32Array([0, 1, -1, 2, -2]), 16000));

    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
    expect(view.getInt16(50, true)).toBe(32767);
    expect(view.getInt16(52, true)).toBe(-32768);
  });
});

describe('convertToWav', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubDecode(decode: () => Promise<unknown>) {
    const contextArgs: unknown[][] = [];
    vi.stubGlobal(
      'OfflineAudioContext',
      vi.fn().mockImplementation((...args: unknown[]) => {
        contextArgs.push(args);
        return { decodeAudioData: vi.fn(decode) };
      })
    );
    return { contextArgs };
  }

  const decodedAudio = (...channels: number[][]) => ({
    length: channels[0]?.length ?? 0,
    numberOfChannels: channels.length,
    getChannelData: (channel: number) => new Float32Array(channels[channel] ?? []),
  });

  const recording = () =>
    ({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }) as unknown as Blob;

  it('decodes at 16 kHz and returns the WAV with its length', async () => {
    const samples = new Array<number>(24000).fill(0.5); // 1.5 s at 16 kHz
    const { contextArgs } = stubDecode(() => Promise.resolve(decodedAudio(samples)));

    const { wav, durationSeconds } = await convertToWav(recording());

    expect(contextArgs[0]?.[2]).toBe(16000);
    expect(durationSeconds).toBe(1.5);
    expect(wav.type).toBe('audio/wav');
    expect(wav.size).toBe(44 + 24000 * 2);
  });

  it('downmixes every channel to mono', async () => {
    stubDecode(() => Promise.resolve(decodedAudio([0.5, -0.5], [0.25, 0.5])));

    const { wav } = await convertToWav(recording());

    const buffer = await new Promise<ArrayBuffer>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(wav);
    });
    const view = new DataView(buffer);
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getInt16(44, true)).toBe(Math.trunc(0.375 * 0x7fff));
    expect(view.getInt16(46, true)).toBe(0);
  });

  it('rejects when decoding fails', async () => {
    stubDecode(() => Promise.reject(new Error('EncodingError')));

    await expect(convertToWav(recording())).rejects.toThrow('EncodingError');
  });
});
