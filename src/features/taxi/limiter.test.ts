import { describe, expect, it } from "vitest";
import { Limiter } from "./limiter";

describe("Limiter", () => {
  it("동시 실행 수를 제한하고 모든 작업을 끝낸다", async () => {
    const limiter = new Limiter(2);
    let active = 0;
    let maxActive = 0;

    const task = async (value: number) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return value;
    };

    const results = await Promise.all(
      [1, 2, 3, 4, 5].map((n) => limiter.run(() => task(n))),
    );

    expect(results).toEqual([1, 2, 3, 4, 5]);
    expect(maxActive).toBe(2);
  });

  it("작업이 실패해도 다음 작업이 실행된다", async () => {
    const limiter = new Limiter(1);
    const failed = limiter.run(async () => {
      throw new Error("fail");
    });
    const ok = limiter.run(async () => "ok");

    await expect(failed).rejects.toThrow("fail");
    await expect(ok).resolves.toBe("ok");
  });
});
