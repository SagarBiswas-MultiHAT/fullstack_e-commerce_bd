'use client';

import { useEffect, useMemo, useState } from 'react';

interface CountdownTimerProps {
  targetTime: string | Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isExpired: false,
  };
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-outline bg-panel px-3 py-2 text-center shadow-soft">
      <p className="text-xl font-bold tabular-nums text-fg">{String(value).padStart(2, '0')}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

export function CountdownTimer({ targetTime }: CountdownTimerProps) {
  const target = useMemo(() => (targetTime instanceof Date ? targetTime : new Date(targetTime)), [targetTime]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(target));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft(target));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [target]);

  if (timeLeft.isExpired) {
    return <p className="text-sm font-semibold text-danger">Flash deal has ended</p>;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Cell label="Days" value={timeLeft.days} />
      <Cell label="Hours" value={timeLeft.hours} />
      <Cell label="Minutes" value={timeLeft.minutes} />
      <Cell label="Seconds" value={timeLeft.seconds} />
    </div>
  );
}
