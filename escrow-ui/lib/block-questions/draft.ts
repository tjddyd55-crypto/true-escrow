type SaveHandler = (key: string, seq: number) => Promise<void>;

export function createDebouncedDraftSaver(delayMs: number) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const seqByKey = new Map<string, number>();

  function nextSeq(key: string): number {
    const next = (seqByKey.get(key) ?? 0) + 1;
    seqByKey.set(key, next);
    return next;
  }

  async function run(key: string, seq: number, handler: SaveHandler) {
    await handler(key, seq);
  }

  return {
    schedule(key: string, handler: SaveHandler): number {
      const seq = nextSeq(key);
      const prev = timers.get(key);
      if (prev) clearTimeout(prev);
      const timer = setTimeout(() => {
        timers.delete(key);
        void run(key, seq, handler);
      }, delayMs);
      timers.set(key, timer);
      return seq;
    },
    flush(key: string, handler: SaveHandler): number {
      const seq = nextSeq(key);
      const prev = timers.get(key);
      if (prev) clearTimeout(prev);
      timers.delete(key);
      void run(key, seq, handler);
      return seq;
    },
    latestSeq(key: string): number {
      return seqByKey.get(key) ?? 0;
    },
    dispose() {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    },
  };
}
