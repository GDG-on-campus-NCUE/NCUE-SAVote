import { useState } from 'react';

interface GlowOrb {
  id: number;
  color: string;
  size: number;
  left: string;
  top: string;
  delay: number;
}

export function GlowOrbs() {
  const [orbs] = useState<GlowOrb[]>([
    {
      id: 1,
      color: 'bg-blue-500/30',
      size: 400,
      left: '10%',
      top: '20%',
      delay: 0,
    },
    {
      id: 2,
      color: 'bg-green-500/20',
      size: 500,
      left: '70%',
      top: '60%',
      delay: 2,
    },
    {
      id: 3,
      color: 'bg-purple-500/20',
      size: 350,
      left: '50%',
      top: '10%',
      delay: 4,
    },
    {
      id: 4,
      color: 'bg-red-500/15',
      size: 300,
      left: '80%',
      top: '80%',
      delay: 6,
    },
  ]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className={`glow-orb ${orb.color} absolute rounded-full`}
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            left: orb.left,
            top: orb.top,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
