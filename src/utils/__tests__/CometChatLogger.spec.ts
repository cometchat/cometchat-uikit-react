import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChatLogger, LogLevel } from '../CometChatLogger';

describe('CometChatLogger', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

  beforeEach(() => {
    errorSpy.mockClear();
    warnSpy.mockClear();
    infoSpy.mockClear();
    debugSpy.mockClear();
    // Reset to default level (error) before each test
    CometChatLogger.setLogLevel(LogLevel.error);
  });

  afterEach(() => {
    // Restore default after each test
    CometChatLogger.setLogLevel(LogLevel.error);
  });

  // --- setLogLevel / getLogLevel ---

  describe('setLogLevel / getLogLevel', () => {
    it('defaults to LogLevel.error', () => {
      expect(CometChatLogger.getLogLevel()).toBe(LogLevel.error);
    });

    it('sets and returns LogLevel.none', () => {
      CometChatLogger.setLogLevel(LogLevel.none);
      expect(CometChatLogger.getLogLevel()).toBe(LogLevel.none);
    });

    it('sets and returns LogLevel.warn', () => {
      CometChatLogger.setLogLevel(LogLevel.warn);
      expect(CometChatLogger.getLogLevel()).toBe(LogLevel.warn);
    });

    it('sets and returns LogLevel.info', () => {
      CometChatLogger.setLogLevel(LogLevel.info);
      expect(CometChatLogger.getLogLevel()).toBe(LogLevel.info);
    });

    it('sets and returns LogLevel.debug', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      expect(CometChatLogger.getLogLevel()).toBe(LogLevel.debug);
    });
  });

  // --- error() ---

  describe('error()', () => {
    it('logs when level is error', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      CometChatLogger.error('TestTag', 'something broke');
      expect(errorSpy).toHaveBeenCalledWith('[CometChat:TestTag]', 'something broke');
    });

    it('logs when level is higher than error', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.error('Tag', 'msg');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT log when level is none', () => {
      CometChatLogger.setLogLevel(LogLevel.none);
      CometChatLogger.error('Tag', 'msg');
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('passes extra args through', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      const extra = { detail: 42 };
      CometChatLogger.error('Tag', 'msg', extra);
      expect(errorSpy).toHaveBeenCalledWith('[CometChat:Tag]', 'msg', extra);
    });
  });

  // --- warn() ---

  describe('warn()', () => {
    it('logs when level is warn', () => {
      CometChatLogger.setLogLevel(LogLevel.warn);
      CometChatLogger.warn('WarnTag', 'watch out');
      expect(warnSpy).toHaveBeenCalledWith('[CometChat:WarnTag]', 'watch out');
    });

    it('logs when level is higher than warn', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.warn('Tag', 'msg');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT log when level is error (below warn)', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      CometChatLogger.warn('Tag', 'msg');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does NOT log when level is none', () => {
      CometChatLogger.setLogLevel(LogLevel.none);
      CometChatLogger.warn('Tag', 'msg');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('passes extra args through', () => {
      CometChatLogger.setLogLevel(LogLevel.warn);
      CometChatLogger.warn('Tag', 'msg', 'a', 'b');
      expect(warnSpy).toHaveBeenCalledWith('[CometChat:Tag]', 'msg', 'a', 'b');
    });
  });

  // --- info() ---

  describe('info()', () => {
    it('logs when level is info', () => {
      CometChatLogger.setLogLevel(LogLevel.info);
      CometChatLogger.info('InfoTag', 'fyi');
      expect(infoSpy).toHaveBeenCalledWith('[CometChat:InfoTag]', 'fyi');
    });

    it('logs when level is debug (higher than info)', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.info('Tag', 'msg');
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT log when level is warn (below info)', () => {
      CometChatLogger.setLogLevel(LogLevel.warn);
      CometChatLogger.info('Tag', 'msg');
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('does NOT log when level is error', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      CometChatLogger.info('Tag', 'msg');
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('does NOT log when level is none', () => {
      CometChatLogger.setLogLevel(LogLevel.none);
      CometChatLogger.info('Tag', 'msg');
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('passes extra args through', () => {
      CometChatLogger.setLogLevel(LogLevel.info);
      CometChatLogger.info('Tag', 'msg', 1, 2, 3);
      expect(infoSpy).toHaveBeenCalledWith('[CometChat:Tag]', 'msg', 1, 2, 3);
    });
  });

  // --- debug() ---

  describe('debug()', () => {
    it('logs when level is debug', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.debug('DebugTag', 'trace info');
      expect(debugSpy).toHaveBeenCalledWith('[CometChat:DebugTag]', 'trace info');
    });

    it('does NOT log when level is info (below debug)', () => {
      CometChatLogger.setLogLevel(LogLevel.info);
      CometChatLogger.debug('Tag', 'msg');
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('does NOT log when level is warn', () => {
      CometChatLogger.setLogLevel(LogLevel.warn);
      CometChatLogger.debug('Tag', 'msg');
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('does NOT log when level is error', () => {
      CometChatLogger.setLogLevel(LogLevel.error);
      CometChatLogger.debug('Tag', 'msg');
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('does NOT log when level is none', () => {
      CometChatLogger.setLogLevel(LogLevel.none);
      CometChatLogger.debug('Tag', 'msg');
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('passes extra args through', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.debug('Tag', 'msg', { key: 'val' });
      expect(debugSpy).toHaveBeenCalledWith('[CometChat:Tag]', 'msg', { key: 'val' });
    });
  });

  // --- Cross-level filtering ---

  describe('level filtering across all methods', () => {
    it('at LogLevel.debug, all four methods log', () => {
      CometChatLogger.setLogLevel(LogLevel.debug);
      CometChatLogger.error('T', 'm');
      CometChatLogger.warn('T', 'm');
      CometChatLogger.info('T', 'm');
      CometChatLogger.debug('T', 'm');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledTimes(1);
    });

    it('at LogLevel.none, no methods log', () => {
      CometChatLogger.setLogLevel(LogLevel.none);
      CometChatLogger.error('T', 'm');
      CometChatLogger.warn('T', 'm');
      CometChatLogger.info('T', 'm');
      CometChatLogger.debug('T', 'm');
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });

    it('at LogLevel.info, error + warn + info log, debug does not', () => {
      CometChatLogger.setLogLevel(LogLevel.info);
      CometChatLogger.error('T', 'm');
      CometChatLogger.warn('T', 'm');
      CometChatLogger.info('T', 'm');
      CometChatLogger.debug('T', 'm');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  // --- LogLevel enum values ---

  describe('LogLevel enum', () => {
    it('has correct numeric values', () => {
      expect(LogLevel.none).toBe(0);
      expect(LogLevel.error).toBe(1);
      expect(LogLevel.warn).toBe(2);
      expect(LogLevel.info).toBe(3);
      expect(LogLevel.debug).toBe(4);
    });
  });
});
