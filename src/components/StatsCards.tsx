import { NetworkStats } from '@/lib/types';
import { Server, Activity, HardDrive, Layers, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function StatCard({ title, value, icon, trend, trendUp, delay = 0, accent = 'primary' }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border border-primary/30 bg-card p-5 transition-all duration-300 hover:border-primary hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] group',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 left-0 w-1 h-1 bg-primary/50" />
      <div className="absolute top-0 right-0 w-1 h-1 bg-primary/50" />
      <div className="absolute bottom-0 left-0 w-1 h-1 bg-primary/50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-primary/50" />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-xs text-primary/60 font-mono uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-primary group-hover:text-primary/80 transition-colors">{value}</p>
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
    </div>
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
        value={stats.totalPNodes.toLocaleString()}
        icon={<Server className="h-4 w-4" />}
        trend="> +12 DETECTED"
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
        icon={<HardDrive className="h-4 w-4" />}
        trend="> CAPACITY OK"
        trendUp={true}
        delay={100}
        accent="primary"
      />
      <StatCard
        title="ACTIVE_PODS"
        value={stats.activePods.toLocaleString()}
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
