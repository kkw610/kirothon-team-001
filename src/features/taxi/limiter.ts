/** 동시에 실행되는 비동기 작업 수를 제한한다. 초과분은 먼저 들어온 순서대로 기다린다. */
export class Limiter {
  private active = 0;
  private readonly waiting: Array<() => void> = [];

  constructor(private readonly maxConcurrent: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      // 자리를 넘겨받을 때까지 기다린다. 넘겨받으면 active는 이미 유지된 상태다.
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    } else {
      this.active += 1;
    }
    try {
      return await task();
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active -= 1;
    }
  }
}
