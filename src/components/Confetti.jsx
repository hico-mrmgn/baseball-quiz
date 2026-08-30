import { useState, useEffect, useMemo } from 'react';
import { makeSeededRandom } from '../utils/questionPrep';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const PARTICLE_COUNT = 40;

/**
 * 最善手を出したときの紙吹雪。
 *
 * 紙吹雪の形は trigger（何回目の紙吹雪か）だけで決まるようにしている。
 * 描画中に Math.random() や Date.now() を呼ぶと再描画のたびに結果が変わり、
 * React から見て「純粋でない描画」になってしまうため。
 */
export default function Confetti({ trigger }) {
  // 演出が終わったトリガー番号。片付けは setTimeout のコールバックの中で行う。
  const [clearedTrigger, setClearedTrigger] = useState(0);

  const particles = useMemo(() => {
    if (!trigger) return [];
    const rand = makeSeededRandom(trigger * 2654435761);
    const between = (a, b) => a + rand() * (b - a);
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: `${trigger}-${i}`,
      x: between(10, 90),
      color: COLORS[Math.floor(rand() * COLORS.length)],
      delay: between(0, 0.3),
      duration: between(0.8, 1.5),
      size: between(6, 12),
      rotation: between(0, 360),
    }));
  }, [trigger]);

  useEffect(() => {
    if (!trigger) return undefined;
    const timer = setTimeout(() => setClearedTrigger(trigger), 2000);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (!trigger || clearedTrigger >= trigger) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute confetti-particle"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
