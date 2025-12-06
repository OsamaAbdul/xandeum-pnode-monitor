import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { VersionDistribution } from '@/lib/types';

interface VersionPieChartProps {
  data: VersionDistribution[];
}

const COLORS = [
  'hsl(142, 71%, 45%)', // Bright Green
  'hsl(142, 71%, 35%)',
  'hsl(142, 71%, 25%)',
  'hsl(142, 71%, 15%)',
  'hsl(142, 71%, 10%)', // Dark Green
];

export function VersionPieChart({ data }: VersionPieChartProps) {
  return (
    <div className="rounded-none border border-primary/30 bg-card p-5 h-full relative overflow-hidden group hover:border-primary transition-colors">
      <div className="absolute top-0 right-0 px-2 py-1 bg-primary/10 text-xs font-mono text-primary border-l border-b border-primary/20">
        VERSION_DIST
      </div>
      <h3 className="text-sm font-mono font-semibold mb-4 text-primary tracking-wider">VERSION_DISTRIBUTION</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="version"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--primary))',
                borderRadius: '0px',
                fontFamily: 'JetBrains Mono, monospace',
                color: 'hsl(var(--primary))',
              }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
              labelStyle={{ color: 'hsl(var(--primary))' }}
              formatter={(value: number, name: string) => [`${value} NODES`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}
              formatter={(value) => <span className="text-primary/70">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
