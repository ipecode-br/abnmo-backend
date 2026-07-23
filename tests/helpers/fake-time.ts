export function setFakeTime(date: Date): void {
  jest.useFakeTimers({
    now: date,
    doNotFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'setImmediate',
      'clearImmediate',
      'nextTick',
      'queueMicrotask',
      'hrtime',
      'performance',
    ],
  });
}

export function restoreFakeTime(): void {
  jest.useRealTimers();
}
