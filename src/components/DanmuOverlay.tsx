/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type DanmuItem = { time: number; text: string; color?: string; mode?: 'scroll'|'top'|'bottom' };
type DanmuSettings = { fontSize: number; speed: number; opacity: number; area: number; antiOverlap: boolean };

function detectPerformanceTier() {
  const mem = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  if (mem >= 8 && cores >= 8) return 'high';
  if (mem >= 4 && cores >= 4) return 'mid';
  return 'low';
}

export default function DanmuOverlay({ source, id, title }: { source: string; id: string; title?: string }) {
  const [items, setItems] = useState<DanmuItem[]>([]);
  const [settings, setSettings] = useState<DanmuSettings>(() => {
    try {
      const raw = localStorage.getItem('danmu_settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { fontSize: 18, speed: 1, opacity: 0.9, area: 0.8, antiOverlap: true };
  });
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const perf = useMemo(() => detectPerformanceTier(), []);
  const lanesRef = useRef<number>(Math.max(3, Math.floor((settings.area * 8) * (perf==='high'?1.5:perf==='mid'?1:0.7))));
  const laneBusyRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const mountedRef = useRef<boolean>(false);
  const workerRef = useRef<Worker|null>(null);
  const laneMapRef = useRef<number[]>([]);

  useEffect(() => { laneBusyRef.current = new Array(lanesRef.current).fill(0); }, [settings.area]);

  useEffect(() => {
    mountedRef.current = true;
    // cache key
    const key = `danmu:${source}+${id}`;
    const now = Date.now();
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.exp > now && Array.isArray(obj.items)) {
          setItems(obj.items);
          return;
        }
      }
    } catch {}
    // fetch（可指定 provider 与 limit）
    fetch(`/api/danmu?provider=caiji&limit=500&source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}&title=${encodeURIComponent(title||'')}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data.items) ? data.items : [];
        setItems(arr);
        try {
          localStorage.setItem(key, JSON.stringify({ items: arr, exp: now + 30 * 60 * 1000 }));
        } catch {}
      })
      .catch(() => setItems([]));
    return () => { mountedRef.current = false; };
  }, [source, id, title]);

  // 初始化与使用 Web Worker 计算弹幕轨道分配
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const w = new Worker(new URL('../workers/danmu.worker.ts', import.meta.url));
      workerRef.current = w;
      const overlay = overlayRef.current;
      const width = overlay?.clientWidth || 1280;
      const height = overlay?.clientHeight || 720;
      w.onmessage = (e: MessageEvent) => {
        const data = e.data as any;
        if (data?.ok && Array.isArray(data.positions)) {
          laneMapRef.current = data.positions.map((p: any)=>p.lane);
        }
      };
      const payload = { width, height, items: (items||[]).map((it)=>({ time: it.time, text: it.text, speed: settings.speed*120 })) };
      w.postMessage(payload);
      return () => { w.terminate(); workerRef.current = null; };
    } catch {
      // ignore worker failures; fallback到主线程
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, settings.speed]);

  useEffect(() => {
    try { localStorage.setItem('danmu_settings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  // render loop
  const overlayRef = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const ready = items.filter((d) => Math.abs(d.time - elapsed) < 0.5);
      ready.forEach((d) => spawnDanmu(d));
    }, 300);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, settings, perf]);

  function chooseLane(idx?: number): number {
    const suggested = typeof idx === 'number' ? laneMapRef.current[idx] : undefined;
    if (typeof suggested === 'number') return Math.max(0, Math.min(lanesRef.current-1, suggested));
    const now = Date.now();
    for (let i = 0; i < laneBusyRef.current.length; i++) {
      if (now > laneBusyRef.current[i]) return i;
    }
    return Math.floor(Math.random() * laneBusyRef.current.length);
  }

  function spawnDanmu(d: DanmuItem) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const container = overlay as HTMLDivElement;
    const idx = items.indexOf(d);
    const lane = chooseLane(idx);
    const div = document.createElement('div');
    div.textContent = d.text;
    div.style.position = 'absolute';
    div.style.whiteSpace = 'nowrap';
    div.style.pointerEvents = 'none';
    div.style.top = `${lane * (settings.fontSize + 8)}px`;
    div.style.left = `${container.clientWidth + 10}px`;
    div.style.fontSize = `${settings.fontSize}px`;
    div.style.opacity = String(settings.opacity);
    div.style.color = d.color || '#ffffff';
    container.appendChild(div);
    const distance = container.clientWidth + div.clientWidth + 20;
    const duration = (distance / (120 * settings.speed)) * (perf==='high'?0.8:perf==='mid'?1:1.2);
    const start = performance.now();
    laneBusyRef.current[lane] = Date.now() + duration * 1000 * (settings.antiOverlap ? 1 : 0.5);
    function tick(now: number) {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const x = container.clientWidth + 10 - t * distance;
      div.style.transform = `translateX(${x}px)`;
      if (t < 1 && mountedRef.current) {
        requestAnimationFrame(tick);
      } else {
        if (container.contains(div)) container.removeChild(div);
      }
    }
    requestAnimationFrame(tick);
  }

  function submit() {
    if (!text.trim()) return;
    const d: DanmuItem = { time: (Date.now() - startTimeRef.current) / 1000 + 0.2, text: text.trim(), color: '#22c55e', mode: 'scroll' };
    setItems((prev) => [...prev, d]);
    setText('');
    setShowInput(false);
  }

  return (
    <div className='pointer-events-none absolute inset-0 z-[520]'>
      {/* 弹幕层 */}
      <div ref={overlayRef} className='absolute inset-0 overflow-hidden'></div>

      {/* 控件：桌面端显示 */}
      <div className='pointer-events-auto absolute top-3 right-3 hidden md:flex gap-2'>
        <button
          onClick={() => setShowInput((v) => !v)}
          className='px-3 py-1 rounded-full bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 text-sm text-gray-800 dark:text-gray-200 shadow-md hover:bg-white/40 dark:hover:bg-gray-900/50'
        >弹字</button>
        <div className='inline-flex items-center px-3 py-1 rounded-full bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 shadow-md gap-2'>
          <label className='text-xs text-gray-700 dark:text-gray-300'>字号</label>
          <input type='number' value={settings.fontSize} onChange={(e)=>setSettings({...settings, fontSize: Math.max(12, Number(e.target.value)||18)})} className='w-14 rounded-full bg-transparent text-sm text-gray-800 dark:text-gray-200' />
          <label className='text-xs text-gray-700 dark:text-gray-300'>速度</label>
          <input type='number' step='0.1' value={settings.speed} onChange={(e)=>setSettings({...settings, speed: Math.max(0.5, Number(e.target.value)||1)})} className='w-14 rounded-full bg-transparent text-sm text-gray-800 dark:text-gray-200' />
          <label className='text-xs text-gray-700 dark:text-gray-300'>透明</label>
          <input type='number' step='0.1' value={settings.opacity} onChange={(e)=>setSettings({...settings, opacity: Math.min(1, Math.max(0.2, Number(e.target.value)||0.9))})} className='w-14 rounded-full bg-transparent text-sm text-gray-800 dark:text-gray-200' />
        </div>
      </div>

      {/* 输入框 */}
      {showInput && (
        <div className='pointer-events-auto absolute top-12 right-3 hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 shadow-md'>
          <input value={text} onChange={(e)=>setText(e.target.value)} placeholder='输入弹字...' className='bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200' />
          <button onClick={submit} className='px-3 py-1 rounded-full bg-white/40 dark:bg-gray-900/50 border border-gray-200/40 dark:border-gray-700/40 text-sm text-gray-800 dark:text-gray-200'>发送</button>
        </div>
      )}
    </div>
  );
}