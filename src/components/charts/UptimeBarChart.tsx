import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UptimeBucket } from '@/lib/types';

interface UptimeBarChartProps {
  data: UptimeBucket[];
}

const COLORS = [
  'hsl(142, 71%, 15%)',   // <80% - Darkest Green
  'hsl(142, 71%, 25%)',   // 80-90%
  'hsl(142, 71%, 35%)',   // 90-95%
  'hsl(142, 71%, 45%)',   // >95% - Brightest Green
];

export function UptimeBarChart({ data }: UptimeBarChartProps) {
  return (
    <div className="rounded-none border border-primary/30 bg-card p-5 h-full relative overflow-hidden group hover:border-primary transition-colors">
      <div className="absolute top-0 right-0 px-2 py-1 bg-primary/10 text-xs font-mono text-primary border-l border-b border-primary/20">
        UPTIME_METRICS
      </div>
      <h3 className="text-sm font-mono font-semibold mb-4 text-primary tracking-wider">UPTIME_DISTRIBUTION</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#cccccc', fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#555555', opacity: 0.5 }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="range"
              tick={{ fontSize: 12, fill: '#cccccc', fontFamily: 'JetBrains Mono', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--primary))',
                borderRadius: '0px',
                fontFamily: 'JetBrains Mono, monospace',
                color: 'hsl(var(--primary))',
              }}
              cursor={{ fill: 'hsl(var(--primary))', opacity: 0.1 }}
              labelStyle={{ color: 'hsl(var(--primary))' }}
              formatter={(value: number, _, payload) => [
                `${value} NODES`,
                'COUNT'
              ]}
            />
            <Bar
              dataKey="count"
              radius={[0, 2, 2, 0]}
              maxBarSize={30}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
