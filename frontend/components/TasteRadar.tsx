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

  // Rich gradient colors matching app theme: purple/magenta (primary), yellow/gold (secondary), pink (accent)
  // Plus complementary colors for variety: cyan, blue, teal, indigo, violet, orange
  const gradientId = 'tasteRadarGradient';
  const gradientColors = [
    '#a855f7', // Purple (primary theme)
    '#ec4899', // Pink (accent theme)
    '#f59e0b', // Amber/Gold (secondary theme)
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#f97316', // Orange
    '#d946ef', // Fuchsia
    '#a855f7', // Back to purple for seamless loop
  ];

  return (
    <div className="w-full h-96 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientColors.map((color, index) => (
                <stop
                  key={index}
                  offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                  stopColor={color}
                  stopOpacity={0.7}
                />
              ))}
            </linearGradient>
            <radialGradient id={`${gradientId}Radial`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.1} />
            </radialGradient>
          </defs>
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
            stroke={`url(#${gradientId})`}
            fill={`url(#${gradientId}Radial)`}
            fillOpacity={0.4}
            strokeWidth={2}
            dot={{ fill: '#a855f7', r: 4 }}
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
          <div className="text-2xl font-bold gradient-text">Spectrum</div>
        </motion.div>
      </div>
    </div>
  );
}
