// logger.ts — 프로젝트 공통 로거 유틸리티
// console.log/error 직접 사용 금지 원칙에 따라 이 모듈을 통해 출력한다.
// 운영 환경에서는 향후 pino 등 구조화 로거로 교체 예정.

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMsg(level: LogLevel, msg: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] ${msg}`;
}

export const logger = {
  info(msg: string, ...args: unknown[]): void {
    console.log(formatMsg('info', msg), ...args);
  },

  warn(msg: string, ...args: unknown[]): void {
    console.warn(formatMsg('warn', msg), ...args);
  },

  error(msg: string, ...args: unknown[]): void {
    console.error(formatMsg('error', msg), ...args);
  },

  debug(msg: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMsg('debug', msg), ...args);
    }
  },
};
