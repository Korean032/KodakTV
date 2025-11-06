/* eslint-disable @typescript-eslint/no-explicit-any */
// Web Worker: compute danmu lanes to minimize overlap
// Input: { width, height, items: [{ time, text, speed }] }
// Output: positions mapping for indexes

export type WorkerDanmuItem = { time: number; text: string; speed: number };

function compute(items: WorkerDanmuItem[], width: number, height: number) {
  // simple lane algorithm: assign to lanes where last endX < 0 (fully moved out)
  const laneCount = Math.max(3, Math.floor(height / 32));
  const lanes: number[] = new Array(laneCount).fill(0); // track last endX
  const out: { lane: number }[] = [];
  items.forEach((it, idx) => {
    let chosen = 0;
    for (let l = 0; l < laneCount; l++) {
      if (lanes[l] <= 0) { chosen = l; break; }
    }
    out[idx] = { lane: chosen };
    // estimate width by text length
    const estWidth = Math.min(width * 0.6, Math.max(80, it.text.length * 12));
    // time to fully pass: (width + estWidth) / speed
    const duration = (width + estWidth) / Math.max(50, it.speed);
    lanes[chosen] = duration * 60; // frames approx
    // decay all lanes
    for (let l = 0; l < laneCount; l++) lanes[l] = Math.max(0, lanes[l] - 30);
  });
  return out;
}

self.onmessage = (e: MessageEvent) => {
  const { width, height, items } = e.data as { width: number; height: number; items: WorkerDanmuItem[] };
  try {
    const positions = compute(items, width, height);
    (self as any).postMessage({ ok: true, positions });
  } catch (err) {
    (self as any).postMessage({ ok: false, error: (err as Error).message });
  }
};