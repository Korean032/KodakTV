/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import PageLayout from '@/components/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import VideoCard from '@/components/VideoCard';

type TabKey = 'ai' | 'youtube' | 'calendar';

export default function RecommendPage() {
  const [tab, setTab] = useState<TabKey>('ai');
  const [userPrompt, setUserPrompt] = useState('热门');
  const [style, setStyle] = useState<'movie' | 'youtube' | 'link'>('movie');
  const [aiItems, setAiItems] = useState<any[]>([]);
  const [ytItems, setYtItems] = useState<any[]>([]);
  const [calendarItems, setCalendarItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const capsule = 'inline-flex items-center px-3 py-1 rounded-full bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 shadow-md';

  const fetchAI = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/ai/search?q=${encodeURIComponent(userPrompt)}&type=${style}`);
      const data = await res.json();
      setAiItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setAiItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchYouTube = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/youtube/search?q=${encodeURIComponent(userPrompt)}`);
      const data = await res.json();
      setYtItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setYtItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/tmdb/search?kind=calendar`);
      const data = await res.json();
      setCalendarItems(Array.isArray(data) ? data : []);
    } catch {
      setCalendarItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'ai') fetchAI();
    if (tab === 'youtube') fetchYouTube();
    if (tab === 'calendar') fetchCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const renderCards = useMemo(() => {
    const items = tab === 'ai' ? aiItems : tab === 'youtube' ? ytItems : calendarItems;
    return (
      <ScrollableRow>
        {items.map((item: any, idx: number) => (
          <div key={idx} className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'>
            <VideoCard
              from='douban'
              title={item.title}
              poster={item.cover}
              douban_id={Number(item.id) || 0}
              year={item.year || ''}
              type={item.type === 'movie' ? 'movie' : ''}
            />
          </div>
        ))}
        {items.length === 0 && !loading && (
          <div className='text-sm text-gray-500 dark:text-gray-400 px-3'>暂无数据</div>
        )}
      </ScrollableRow>
    );
  }, [tab, aiItems, ytItems, calendarItems, loading]);

  return (
    <PageLayout activePath='/recommend'>
      <div className='px-2 sm:px-10 py-4 sm:py-8'>
        <div className='max-w-[95%] mx-auto space-y-6'>
          {/* 顶部导航：胶囊液态玻璃 */}
          <div className='flex items-center justify-between'>
            <div className={`hidden md:flex ${capsule}`}>
              <button className={`px-3 py-1 rounded-full ${tab==='ai'?'text-gray-900 dark:text-gray-100':'text-gray-700 dark:text-gray-300'}`} onClick={()=>setTab('ai')}>AI 推荐</button>
              <button className={`px-3 py-1 rounded-full ${tab==='youtube'?'text-gray-900 dark:text-gray-100':'text-gray-700 dark:text-gray-300'}`} onClick={()=>setTab('youtube')}>YouTube</button>
              <button className={`px-3 py-1 rounded-full ${tab==='calendar'?'text-gray-900 dark:text-gray-100':'text-gray-700 dark:text-gray-300'}`} onClick={()=>setTab('calendar')}>发布日历</button>
            </div>
            <Link href='/' className={`text-sm ${capsule}`}>返回首页</Link>
          </div>

          {/* 控件区：提示词 & 风格选择（仅AI/YouTube） */}
          {(tab === 'ai' || tab === 'youtube') && (
            <div className='flex flex-col sm:flex-row gap-3'>
              <input
                value={userPrompt}
                onChange={(e)=>setUserPrompt(e.target.value)}
                placeholder='输入提示词，例如：科幻 热门'
                className='flex-1 px-4 py-2 rounded-full bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 text-gray-900 dark:text-gray-100 shadow-md'
              />
              {tab==='ai' && (
                <select
                  value={style}
                  onChange={(e)=>setStyle(e.target.value as any)}
                  className='px-4 py-2 rounded-full bg-white/30 dark:bg-gray-900/40 backdrop-blur-3xl border border-gray-200/40 dark:border-gray-700/40 text-gray-900 dark:text-gray-100 shadow-md'
                >
                  <option value='movie'>影视</option>
                  <option value='youtube'>YouTube 视频</option>
                  <option value='link'>视频链接解析</option>
                </select>
              )}
              <button onClick={tab==='ai'?fetchAI:fetchYouTube} className={`px-4 py-2 ${capsule}`}>刷新</button>
            </div>
          )}

          {/* 发布日历筛选（后续扩展为周/频道） */}
          {tab==='calendar' && (
            <div className='flex gap-3'>
              <button onClick={fetchCalendar} className={`px-4 py-2 ${capsule}`}>本周</button>
              <button onClick={fetchCalendar} className={`px-4 py-2 ${capsule}`}>下周</button>
            </div>
          )}

          {/* 渲染卡片 */}
          <section>{renderCards}</section>
        </div>
      </div>
    </PageLayout>
  );
}