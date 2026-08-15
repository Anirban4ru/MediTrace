'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const NEWS_ITEMS = [
  "WHO reports a 20% increase in counterfeit medicines in Southeast Asia.",
  "New guidelines issued for cold-chain integrity in biologicals transport.",
  "India implements blockchain tracking for export-grade pharmaceuticals.",
  "Interpol seizes $14M worth of fake vaccines in global operation.",
  "FDA warns against unauthorized online pharmacies selling temperature-sensitive drugs.",
  "Supply chain disruptions lead to critical medicine shortages in remote regions.",
];

export function NewsTicker() {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
        if (data.headlines && data.headlines.length > 0) {
          setHeadlines(data.headlines);
        } else {
          setHeadlines(["No live news available."]);
        }
      })
      .catch(() => {
        setHeadlines(["Error fetching live news. Check network."]);
      });
  }, []);

  useEffect(() => {
    if (headlines.length === 0) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % headlines.length);
        setFade(true);
      }, 500);
    }, 4000); // 4 seconds per headline to allow reading real news

    return () => clearInterval(interval);
  }, [headlines]);

  return (
    <div className="border shadow-sm flex items-center bg-[var(--bg-surface)] overflow-hidden h-12 w-full">
      <div className="bg-[var(--ink)] text-[var(--bg)] h-full px-4 flex items-center gap-2 font-bold uppercase text-[11px] tracking-[0.14em] shrink-0">
        <Globe className="h-4 w-4" strokeWidth={2.5} />
        Live News
      </div>
      <div className="px-4 flex-1 truncate">
        <span
          className={cn(
            "mono-data text-[12px] uppercase tracking-[0.1em] text-ink transition-opacity duration-300",
            fade ? "opacity-100" : "opacity-0"
          )}
        >
          {headlines.length > 0 ? headlines[currentIndex] : "Fetching live data..."}
        </span>
      </div>
    </div>
  );
}
