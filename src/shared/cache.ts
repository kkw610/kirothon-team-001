/** 프로세스 메모리 기반 TTL 캐시. 서버 재시작이나 인스턴스 간에는 공유되지 않는다. */
interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T> {
  private readonly store = new Map<string, Entry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 500,
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** 캐시에 있으면 반환하고, 없으면 loader를 한 번 실행해 저장한다. 같은 키의 동시 호출은 한 번만 실행한다. */
  async getOrLoad(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const promise = loader()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }

  private readonly inflight = new Map<string, Promise<T>>();
}
