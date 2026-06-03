/* eslint-disable */
/**
 * Timer
 *
 * A timer that emits tick events using requestAnimationFrame.
 * Adapted from WaveSurfer library for Angular compatibility.
 *
 * @see Requirements 14.1, 14.2
 */

import EventEmitter from './event-emitter';

type TimerEvents = {
  tick: [];
};

class Timer extends EventEmitter<TimerEvents> {
  private unsubscribe: () => void = () => undefined;

  start() {
    this.unsubscribe = this.on('tick', () => {
      requestAnimationFrame(() => {
        this.emit('tick');
      });
    });
    this.emit('tick');
  }

  stop() {
    this.unsubscribe();
  }

  destroy() {
    this.unsubscribe();
  }
}

export default Timer;
