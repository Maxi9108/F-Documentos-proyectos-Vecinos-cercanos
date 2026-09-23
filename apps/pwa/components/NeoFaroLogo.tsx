'use client';

import React from 'react';

interface NeoFaroLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
  className?: string;
}

export default function NeoFaroLogo({
  size = 'md',
  showSlogan = true,
  className = '',
}: NeoFaroLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const sloganSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Isotipo: Faro / Ondas Concéntricas Neón Violeta y Cian */}
      <div
        className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-2xl bg-zinc-950/90 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.35)] p-1.5 transition-transform hover:scale-105`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 via-transparent to-cyan-400/20 rounded-2xl pointer-events-none" />
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]"
        >
          <defs>
            <linearGradient id="grad-neofaro-wave" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <linearGradient id="grad-neofaro-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="grad-neofaro-violet" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>

          {/* Anillo exterior de onda satelital / faro */}
          <path
            d="M 50,14 A 36,36 0 1,1 14,50"
            stroke="url(#grad-neofaro-violet)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Anillo intermedio */}
          <path
            d="M 50,26 A 24,24 0 1,1 26,50"
            stroke="url(#grad-neofaro-wave)"
            strokeWidth="6.5"
            strokeLinecap="round"
          />

          {/* Anillo central y núcleo emisor */}
          <circle
            cx="50"
            cy="50"
            r="12"
            stroke="url(#grad-neofaro-cyan)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="4.5" fill="#22d3ee" className="animate-pulse" />
        </svg>
      </div>

      {/* Logotipo y Slogan */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-wider uppercase bg-gradient-to-r from-white via-zinc-100 to-cyan-300 bg-clip-text text-transparent ${titleSizes[size]}`}
            style={{ letterSpacing: '0.04em' }}
          >
            NEOFARO
          </span>
          <span className="text-cyan-400 font-black text-xl leading-none animate-pulse">.</span>
        </div>

        {showSlogan && (
          <p
            className={`text-zinc-400 font-medium tracking-tight flex items-center gap-1 leading-tight ${sloganSizes[size]}`}
          >
            <span>Descubrí tu barrio, cerca y sin vueltas.</span>
          </p>
        )}
      </div>
    </div>
  );
}
