/**
 * Sample rate for WAV voice notes. 16 kHz mono 16-bit is speech quality at
 * about 1.9 MB per minute.
 */
const WAV_SAMPLE_RATE = 16000;

/** WAV header size in bytes (RIFF + fmt + data chunk headers). */
const WAV_HEADER_SIZE = 44;

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Encode mono float samples (-1..1) as a 16-bit PCM WAV file.
 */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(WAV_HEADER_SIZE + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(WAV_HEADER_SIZE + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return buffer;
}

/**
 * Convert a recording to 16 kHz mono WAV, returning the WAV and its length.
 *
 * MediaRecorder's output varies by browser (WebM, Ogg or fragmented MP4) and
 * often has no usable length in its header, and iOS can't play WebM or Ogg.
 * WAV plays on every platform and its header always carries the exact length.
 * React v5/v6 did the same before sending audio (`processFileForAudio`).
 */
export async function convertToWav(blob: Blob): Promise<{ wav: Blob; durationSeconds: number }> {
  // decodeAudioData resamples to its context's rate and filters out what that rate
  // can't hold, which rendering through a lower-rate context doesn't do.
  const decoded = await new OfflineAudioContext(1, 1, WAV_SAMPLE_RATE).decodeAudioData(
    await blob.arrayBuffer()
  );
  // It keeps the recording's channels, so downmix to mono here.
  const samples = new Float32Array(decoded.length);
  for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
    const channelData = decoded.getChannelData(channel);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = (samples[i] ?? 0) + (channelData[i] ?? 0) / decoded.numberOfChannels;
    }
  }
  return {
    wav: new Blob([encodeWav(samples, WAV_SAMPLE_RATE)], { type: 'audio/wav' }),
    durationSeconds: samples.length / WAV_SAMPLE_RATE,
  };
}
