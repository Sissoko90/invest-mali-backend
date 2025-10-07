import React from 'react';

export type AgentStats = {
  total?: number;
  pending?: number;
  in_review?: number;
  approved?: number;
  rejected?: number;
  my_assigned?: number;
};

type Props = {
  stats: AgentStats | null;
  loading?: boolean;
};

// Tiny inline sparkline component (area chart)
const Sparkline: React.FC<{ points: number[]; width?: number; height?: number; theme?: 'light' | 'dark' }>
  = ({ points, width = 120, height = 36, theme = 'light' }) => {
  if (!points.length) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const dx = width / (points.length - 1 || 1);
  const scaleY = (v: number) => {
    if (max === min) return height / 2; // flat line
    return height - ((v - min) / (max - min)) * height;
  };
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * dx} ${scaleY(v)}`).join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  const stroke = theme === 'dark' ? '#60a5fa' : '#0ea5e9';
  const fill = theme === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(14,165,233,0.15)';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};

const KpiCards: React.FC<Props> = ({ stats, loading }) => {
  const items = [
    { label: 'Total', value: stats?.total ?? 0 },
    { label: 'En attente', value: stats?.pending ?? 0 },
    { label: 'En revue', value: stats?.in_review ?? 0 },
    { label: 'Approuvées', value: stats?.approved ?? 0 },
    { label: 'Rejetées', value: stats?.rejected ?? 0 },
    { label: 'Mes dossiers', value: stats?.my_assigned ?? 0 },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {items.map((k, idx) => (
        <div
          key={k.label}
          className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur shadow-sm hover:shadow-lg transition-all duration-300 dark:bg-gray-800/70 dark:border-gray-700 animate-fade-in-up"
          style={{ animationDelay: `${idx * 80}ms` }}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-mali-emerald/20 to-mali-gold/20 blur-2xl" />
          <div className="px-5 py-6 sm:p-6 relative">
            <dt className="text-sm font-medium text-gray-600 truncate dark:text-gray-300">{k.label}</dt>
            <dd className="mt-2 text-3xl font-bold text-mali-dark tracking-tight dark:text-white">
              {loading ? (
                <span className="inline-block h-8 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              ) : (
                k.value
              )}
            </dd>
            <div className="mt-3">
              {loading ? (
                <div className="h-9 w-full rounded bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
              ) : (
                <div className="-ml-1">
                  <Sparkline
                    points={[
                      Math.max(0, k.value * 0.5),
                      Math.max(0, k.value * 0.7),
                      Math.max(0, k.value * 0.65),
                      Math.max(0, k.value * 0.9),
                      k.value,
                    ]}
                    width={140}
                    height={40}
                    theme={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-primary-500 via-mali-emerald to-mali-gold" />
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
