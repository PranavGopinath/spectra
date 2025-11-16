'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface TasteRadarProps {
  tasteVector: number[];
  dimensionNames: string[];
}

export default function TasteRadar({ tasteVector, dimensionNames }: TasteRadarProps) {
  // Prepare data for radar chart
  const data = dimensionNames.map((name, index) => ({
    dimension: name.split(' ')[0], // Shorten for display
    fullName: name,
    score: Math.max(-1, Math.min(1, tasteVector[index] || 0)),
    fullMark: 1,
  }));

  // Get color based on score
  const getColor = (score: number) => {
    if (score > 0.5) return '#a855f7'; // Purple
    if (score > 0) return '#ec4899'; // Pink
    if (score > -0.5) return '#3b82f6'; // Blue
    return '#8b5cf6'; // Indigo
  };

  // Calculate average score for gradient
  const avgScore = tasteVector.reduce((a, b) => a + Math.abs(b), 0) / tasteVector.length;
  const primaryColor = avgScore > 0.5 ? '#a855f7' : '#ec4899';

  return (
    <div className="w-full h-96 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid 
            stroke="rgba(255, 255, 255, 0.1)" 
            strokeWidth={1}
          />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ 
              fontSize: 11, 
              fill: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500
            }}
            className="text-xs"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[-1, 1]} 
            tick={{ fontSize: 9, fill: 'rgba(255, 255, 255, 0.4)' }}
            className="opacity-50"
            tickCount={5}
          />
          <Radar
            name="Taste"
            dataKey="score"
            stroke={primaryColor}
            fill={primaryColor}
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{ fill: primaryColor, r: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="text-2xl font-bold gradient-text">Taste</div>
          <div className="text-xs text-white/40 mt-1">8 Dimensions</div>
        </motion.div>
      </div>
    </div>
  );
}
