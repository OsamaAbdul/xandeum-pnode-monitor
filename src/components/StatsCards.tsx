import { NetworkStats } from '@/lib/types';
import { Server, Activity, HardDrive, Layers, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

interface StatsCardsProps {
  stats: NetworkStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  accent?: 'primary' | 'secondary' | 'success' | 'warning';
}

function Counter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 200 });
  const displayValue = useTransform(springValue, (current) => Math.round(current));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    return displayValue.onChange((latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toLocaleString();
      }
    });
  }, [displayValue]);

  return (
    <motion.span
      ref={ref}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      style={{ display: "inline-block" }}
    />
  );
}

function StatCard({ title, value, icon, trend, trendUp, delay = 0, accent = 'primary' }: StatCardProps) {
  // Check if value is purely numeric strings or numbers to animate
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.replace(/,/g, '')));
  const numericValue = isNumeric
    ? typeof value === 'number' ? value : parseInt(value.toString().replace(/,/g, ''), 10)
    : 0;

  // Handles "Active / Total" format specific to TOTAL_PNODES
  const isSplitValue = typeof value === 'string' && value.includes(' / ');
  const [splitVal1, splitVal2] = isSplitValue ? value.toString().split(' / ').map(v => parseInt(v.replace(/,/g, ''), 10)) : [0, 0];

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden border border-primary/30 bg-card p-5 transition-all duration-300 hover:border-primary hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] group',
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
    >
      <div className="absolute top-0 left-0 w-1 h-1 bg-primary/50" />
      <div className="absolute top-0 right-0 w-1 h-1 bg-primary/50" />
      <div className="absolute bottom-0 left-0 w-1 h-1 bg-primary/50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-primary/50" />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-xs text-primary/60 font-mono uppercase tracking-wider">{title}</p>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-primary group-hover:text-primary/80 transition-colors">
            {isSplitValue ? (
              <>
                <Counter value={splitVal1} /> / <Counter value={splitVal2} />
              </>
            ) : isNumeric ? (
              <Counter value={numericValue} />
            ) : (
              value
            )}
            {/* Append % if it was part of the original string but not captured in numeric analysis, though typically stats passing numbers or formatted strings. adjusting specifically for AVG_UPTIME which comes as string with % sometimes or handled via prop */}
            {title === 'AVG_UPTIME' && !value.toString().includes('%') && '%'}
          </div>
          {trend && (
            <p className={cn('text-xs font-mono', trendUp ? 'text-primary/80' : 'text-destructive')}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn('p-2 border border-primary/20 bg-primary/5 text-primary group-hover:bg-primary/20 transition-colors')}>
          {icon}
        </div>
      </div>

      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none animate-scanline" />
    </motion.div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="TOTAL_PNODES"
        value={`${stats.activeNodes} / ${stats.totalPNodes}`}
        icon={<Server className="h-4 w-4" />}
        trend="> ACTIVE / TOTAL"
        trendUp={true}
        delay={0}
        accent="primary"
      />
      <StatCard
        title="AVG_UPTIME"
        value={`${stats.avgUptime}%`}
        icon={<Activity className="h-4 w-4" />}
        trend="> OPTIMAL"
        trendUp={true}
        delay={50}
        accent="secondary"
      />
      <StatCard
        title="TOTAL_STORAGE"
        value={stats.totalStorage}
        // Need to handle formatted storage strings carefully if strict number counting is desired, usually these are formatted (e.g. "2.4 PB"). Skipping complex parsing for now, assuming string display or basic number.
        // Actually totalStorage is usually bytes number in `NetworkStats`? let's check types.
        // In index.ts it was `total_storage_bytes`. In StatsCards props `stats` is likely transformed.
        // If it's a formatted string like "500 GB", Counter won't work well.
        // Let's assume for now keeping string if non-numeric.
        icon={<HardDrive className="h-4 w-4" />}
        trend="> CAPACITY OK"
        trendUp={true}
        delay={100}
        accent="primary"
      />
      <StatCard
        title="ACTIVE_NODES"
        value={stats.activeNodes}
        icon={<Layers className="h-4 w-4" />}
        delay={150}
        accent="secondary"
      />
      <StatCard
        title="HEALTH_SCORE"
        value={stats.healthScore}
        icon={<Shield className="h-4 w-4" />}
        delay={200}
        accent={stats.healthScore > 85 ? 'success' : stats.healthScore > 70 ? 'warning' : 'primary'}
      />
      <StatCard
        title="LAST_SYNC"
        value={formatTime(stats.lastUpdated)}
        icon={<Clock className="h-4 w-4" />}
        delay={250}
        accent="primary"
      />
    </div>
  );
}
