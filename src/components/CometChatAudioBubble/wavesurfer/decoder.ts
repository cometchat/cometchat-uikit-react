/* eslint-disable */
/**
 * Decoder
 *
 * Audio decoding utilities using Web Audio API.
 * Adapted from WaveSurfer library for Angular compatibility.
 *
 * @see Requirements 14.1, 14.2
 */

/** Decode an array buffer into an audio buffer */
async function decode(audioData: ArrayBuffer, sampleRate: number): Promise<AudioBuffer> {
  const audioCtx = new AudioContext({ sampleRate });
  const decode = audioCtx.decodeAudioData(audioData);
  return decode.finally(() => audioCtx.close());
}

/** Normalize peaks to -1..1 */
function normalize<T extends Array<Float32Array | number[]>>(channelData: T): T {
  const firstChannel = channelData[0];
  if (!firstChannel) return channelData;
  if (firstChannel.some(n => n > 1 || n < -1)) {
    const length = firstChannel.length;
    let max = 0;
    for (let i = 0; i < length; i++) {
      const absN = Math.abs(firstChannel[i] ?? 0);
      if (absN > max) max = absN;
    }
    for (const channel of channelData) {
      for (let i = 0; i < length; i++) {
        channel[i] = (channel[i] ?? 0) / max;
      }
    }
  }
  return channelData;
}

/** Create an audio buffer from pre-decoded audio data */
function createBuffer(channelData: Array<Float32Array | number[]>, duration: number): AudioBuffer {
  // If a single array of numbers is passed, make it an array of arrays
  if (typeof channelData[0] === 'number') channelData = [channelData as unknown as number[]];

  // Normalize to -1..1
  normalize(channelData);

  const firstChannel = channelData[0] ?? [];

  return {
    duration,
    length: firstChannel.length,
    sampleRate: firstChannel.length / duration,
    numberOfChannels: channelData.length,
    getChannelData: (i: number) => channelData?.[i] as Float32Array<ArrayBuffer>,
    copyFromChannel: AudioBuffer.prototype.copyFromChannel,
    copyToChannel: AudioBuffer.prototype.copyToChannel,
  };
}

const Decoder = {
  decode,
  createBuffer,
};

export default Decoder;
