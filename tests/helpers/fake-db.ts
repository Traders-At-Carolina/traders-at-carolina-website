import { vi } from "vitest";

/**
 * A chainable stand-in for the Drizzle client: every query, whatever its chain (select/from/where/limit…), resolves to
 * the next queued result. `calls` records each chain's method names and arguments for assertions.
 */
export function fakeDb() {
  const results: unknown[] = [];
  const calls: Array<Array<{ method: string; args: unknown[] }>> = [];
  const chain = () => {
    const steps: Array<{ method: string; args: unknown[] }> = [];
    calls.push(steps);
    const proxy: unknown = new Proxy(() => {}, {
      get(_t, prop) {
        if (prop === "then") {
          const next = results.shift();
          const settle = next instanceof Error ? Promise.reject(next) : Promise.resolve(next ?? []);
          return settle.then.bind(settle);
        }
        return (...args: unknown[]) => {
          steps.push({ method: String(prop), args });
          return proxy;
        };
      },
    });
    return proxy;
  };
  const db = { select: () => chain(), insert: () => chain(), update: () => chain(), delete: () => chain(), batch: vi.fn(async () => []) };
  return {
    db: () => db,
    queue: (...r: unknown[]) => void results.push(...r),
    calls,
    methods: (i: number) => calls[i]?.map((s) => s.method),
  };
}
