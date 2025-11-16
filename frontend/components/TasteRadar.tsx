'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface TasteRadarProps {
  tasteVector: number[];
  dimensionNames: string[];
}

export default function TasteRadar({ tasteVector, dimensionNames }: TasteRadarProps) {
  // Prepare data for radar chart
  const data = dimensionNames.map((name, index) => ({
    dimension: name,
    score: tasteVector[index] || 0,
    fullMark: 1,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ fontSize: 11, fill: 'currentColor' }}
            className="text-xs"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[-1, 1]} 
            tick={{ fontSize: 10 }}
            className="opacity-50"
          />
          <Radar
            name="Taste"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

