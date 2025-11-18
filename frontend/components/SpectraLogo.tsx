'use client'

import { motion } from 'framer-motion'

interface SpectraLogoProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export function SpectraLogo({ size = 'md', animated = true }: SpectraLogoProps) {
  const sizes = {
    sm: { width: 120, height: 32, fontSize: 'text-xl' },
    md: { width: 180, height: 48, fontSize: 'text-3xl' },
    lg: { width: 240, height: 64, fontSize: 'text-5xl' },
  }

  const { width, height, fontSize } = sizes[size]

  // Color spectrum representing movies (blue), books (amber), and music (fuchsia)
  const spectrumColors = [
    '#3b82f6', // blue (movies)
    '#8b5cf6', // purple
    '#d946ef', // fuchsia (music)
    '#f59e0b', // amber (books)
    '#10b981', // emerald
  ]

  return (
    <div className="flex items-center gap-3">
      {/* Animated spectrum icon */}
      <div className="relative" style={{ width: height, height }}>
        <svg
          width={height}
          height={height}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="rgba(0,0,0,0.3)" />
          
          {/* Animated spectrum arcs */}
          {spectrumColors.map((color, index) => {
            const radius = 42 - index * 6
            const circumference = 2 * Math.PI * radius
            const dashArray = circumference * 0.7 // 70% arc
            
            return (
              <motion.circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${dashArray} ${circumference}`}
                initial={{ rotate: index * 20 }}
                animate={
                  animated
                    ? {
                        rotate: [index * 20, index * 20 + 360],
                        strokeDashoffset: [0, -circumference * 0.1],
                      }
                    : { rotate: index * 20 }
                }
                transition={
                  animated
                    ? {
                        rotate: {
                          duration: 8 + index * 2,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                        strokeDashoffset: {
                          duration: 3,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                        },
                      }
                    : {}
                }
                style={{
                  transformOrigin: '50px 50px',
                }}
              />
            )
          })}
          
          {/* Center dot with pulse */}
          <motion.circle
            cx="50"
            cy="50"
            r="4"
            fill="white"
            animate={
              animated
                ? {
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1],
                  }
                : {}
            }
            transition={
              animated
                ? {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : {}
            }
          />
        </svg>
      </div>

      {/* Text logo with gradient */}
      <motion.div
        className={`font-bold tracking-tight ${fontSize}`}
        initial={animated ? { opacity: 0, x: -10 } : {}}
        animate={animated ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <span
          className="bg-gradient-to-r from-blue-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent"
          style={{
            backgroundSize: '200% 100%',
          }}
        >
          Spectra
        </span>
      </motion.div>
    </div>
  )
}

