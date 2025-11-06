"use client";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type BannerItem = { title: string; cover?: string; type?: string };

export default function HeroBanner({ items = [] as BannerItem[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const onNext = () => setIdx((i) => (i + 1) % Math.max(1, items.length));
  const onPrev = () => setIdx((i) => (i - 1 + Math.max(1, items.length)) % Math.max(1, items.length));
  useEffect(() => {
    if (items.length === 0) return;
    timerRef.current = window.setInterval(onNext, 4000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [items.length]);

  const onTouchStart = (e: React.TouchEvent) => { startXRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = startXRef.current; if (start === null) return; const endX = e.changedTouches[0].clientX;
    const dx = endX - start; if (Math.abs(dx) > 40) { if (dx > 0) onPrev(); else onNext(); }
    startXRef.current = null;
  };

  const current = items[idx] || { title: 'KodakTV', cover: '/logo.png' };
  return (
    <div className='relative w-full h-[180px] sm:h-[280px] rounded-2xl overflow-hidden mb-6'
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      <div className='absolute inset-0 bg-gradient-to-r from-green-500/30 via-emerald-500/20 to-teal-500/30' />
      {current.cover && (
        <Image src={current.cover} alt={current.title} fill className='object-cover' />
      )}
      <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
      <div className='absolute bottom-4 left-4 sm:left-8 text-white'>
        <div className='text-xl sm:text-3xl font-bold drop-shadow-lg'>{current.title}</div>
        {current.type && (<div className='mt-1 text-xs sm:text-sm opacity-80'>{current.type==='movie'?'电影':'剧集'}</div>)}
      </div>
      <div className='absolute bottom-4 right-4 flex gap-2'>
        {items.slice(0,8).map((_, i)=>(
          <div key={i} className={`w-2 h-2 rounded-full ${i===idx?'bg-white':'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}