/**
 * Log level enum defining verbosity levels.
 * Ordered from least verbose (none) to most verbose (debug).
 */
export enum LogLevel {
  none = 0,
  error = 1,
  warn = 2,
  info = 3,
  debug = 4,
}

/**
 * Current log level. Only messages at this level or below are output.
 * Default is `error` — only errors are logged.
 */
let currentLevel: LogLevel = LogLevel.error;

/** Sets the active log level. Only messages at this level or below are output. */
function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

/** Returns the current log level. */
function getLogLevel(): LogLevel {
  return currentLevel;
}

/** Logs an error message if the current level permits. */
function error(tag: string, message: string, ...args: unknown[]): void {
  if (currentLevel >= LogLevel.error) {
    console.error(`[CometChat:${tag}]`, message, ...args);
  }
}

/** Logs a warning message if the current level permits. */
function warn(tag: string, message: string, ...args: unknown[]): void {
  if (currentLevel >= LogLevel.warn) {
    console.warn(`[CometChat:${tag}]`, message, ...args);
  }
}

/** Logs an informational message if the current level permits. */
function info(tag: string, message: string, ...args: unknown[]): void {
  if (currentLevel >= LogLevel.info) {
    console.info(`[CometChat:${tag}]`, message, ...args);
  }
}

/** Logs a debug message if the current level permits. */
function debug(tag: string, message: string, ...args: unknown[]): void {
  if (currentLevel >= LogLevel.debug) {
    console.debug(`[CometChat:${tag}]`, message, ...args);
  }
}

/**
 * Centralized logging utility for the CometChat UIKit.
 * All internal logging goes through this object so consumers can control verbosity.
 *
 * @example
 * ```ts
 * import { CometChatLogger, LogLevel } from '@cometchat/chat-uikit-react';
 * CometChatLogger.setLogLevel(LogLevel.debug);
 * ```
 */
export const CometChatLogger = {
  setLogLevel,
  getLogLevel,
  error,
  warn,
  info,
  debug,
} as const;
