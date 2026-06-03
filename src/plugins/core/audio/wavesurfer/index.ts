/**
 * WaveSurfer Library
 *
 * Embedded audio waveform visualization library.
 * Adapted from WaveSurfer for Angular compatibility.
 *
 * @see Requirements 14.1, 14.2, 14.3
 */

export { default as WaveSurfer } from './wavesurfer';
export type { WaveSurferOptions, WaveSurferEvents } from './wavesurfer';
export { default as BasePlugin } from './base-plugin';
export type { BasePluginEvents, GenericPlugin } from './base-plugin';
export { default as Decoder } from './decoder';
export { default as Fetcher } from './fetcher';
export { default as Player } from './player';
export { default as Renderer } from './renderer';
export { default as Timer } from './timer';
export { default as WebAudioPlayer } from './webaudio';
export { default as EventEmitter } from './event-emitter';
export type { GeneralEventTypes } from './event-emitter';
export { makeDraggable } from './draggable';
export { default as createElement } from './dom';
