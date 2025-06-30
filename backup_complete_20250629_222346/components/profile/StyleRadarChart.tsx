
import React from 'react';
// Note: Actual Recharts import for types might be needed if window.Recharts isn't strongly typed enough or for specific types.
// For now, we rely on the global.d.ts declaration.
// import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { StyleCategory } from '../../types';

interface ChartDataPoint {
  subject: StyleCategory;
  A: number; // User's score
  fullMark: number;
}

interface StyleRadarChartProps {
  data: ChartDataPoint[];
}

const StyleRadarChart: React.FC<StyleRadarChartProps> = ({ data }) => {
  if (typeof window === 'undefined' || !window.Recharts) {
    return <div className="text-neon-orange text-center p-4">Recharts library not loaded. Chart cannot be displayed.</div>;
  }

  // Destructure components from window.Recharts
  const { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } = window.Recharts;
  
  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#4A5568" /> {/* Equivalent to gray-600 */}
          <PolarAngleAxis dataKey="subject" stroke="#CBD5E0" tick={{ fontSize: 12 }} /> {/* Equivalent to gray-400 */}
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4A5568" tick={{ fontSize: 10 }} />
          <Radar name="Your Style" dataKey="A" stroke="#00FFFF" fill="#00FFFF" fillOpacity={0.5} strokeWidth={2} />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(16, 16, 26, 0.8)', border: '1px solid #00FFFF', borderRadius: '8px' }}
            labelStyle={{ color: '#00FFFF', fontWeight: 'bold' }}
            itemStyle={{ color: '#E2E8F0' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StyleRadarChart;
