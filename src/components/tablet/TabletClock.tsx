import React, { useState, useEffect, memo } from 'react';
import { formatTabletDateDisplay } from '../../utils/formatters';

interface TabletClockProps {
  theme: 'dark' | 'light';
  fontSizeClass?: string;
  dateSizeClass?: string;
}

export const TabletClock: React.FC<TabletClockProps> = memo(({
  theme,
  fontSizeClass = 'text-4xl sm:text-6xl',
  dateSizeClass = 'text-xs sm:text-sm',
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(formatTabletDateDisplay(now));
    };
    updateTime();
    // 10s tick is sufficient for hour:minute display and minimizes CPU wakeups on battery/old tablets
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-left select-none">
      <h1
        className={`font-extrabold tracking-tight font-mono transition-all leading-none ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        } ${fontSizeClass}`}
      >
        {time}
      </h1>
      <p
        className={`font-semibold tracking-wider mt-1 ${
          theme === 'dark' ? 'text-teal-300' : 'text-teal-700'
        } ${dateSizeClass}`}
      >
        {dateStr}
      </p>
    </div>
  );
});

TabletClock.displayName = 'TabletClock';
