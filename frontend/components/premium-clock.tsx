"use client";

import { useEffect, useState } from "react";

export function PremiumClock() {
  const [time, setTime] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date();
      setTime({
        hours: now.getHours() % 12,
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const secondsRotation = (time.seconds / 60) * 360;
  const minutesRotation = (time.minutes / 60) * 360 + secondsRotation / 60;
  const hoursRotation = (time.hours / 12) * 360 + minutesRotation / 12;

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-80 h-80">
        {/* Vertical Clock Face */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 240 240"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clean white circular face */}
          <circle cx="120" cy="120" r="110" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1" />

          {/* Hour numbers - red */}
          {[...Array(12)].map((_, i) => {
            const number = i === 0 ? 12 : i;
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 120 + 85 * Math.cos(angle);
            const y = 120 + 85 * Math.sin(angle);

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="16"
                fontWeight="600"
                fill="#dc2626"
                fontFamily="system-ui, sans-serif"
              >
                {number}
              </text>
            );
          })}

          {/* Hour markers - small red dots */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 120 + 95 * Math.cos(angle);
            const y = 120 + 95 * Math.sin(angle);

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="2"
                fill="#dc2626"
              />
            );
          })}

          {/* Center dot */}
          <circle cx="120" cy="120" r="4" fill="#1f2937" />

          {/* Hour hand */}
          <line
            x1="120"
            y1="120"
            x2={120 + 50 * Math.cos((hoursRotation - 90) * (Math.PI / 180))}
            y2={120 + 50 * Math.sin((hoursRotation - 90) * (Math.PI / 180))}
            stroke="#1f2937"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Minute hand */}
          <line
            x1="120"
            y1="120"
            x2={120 + 70 * Math.cos((minutesRotation - 90) * (Math.PI / 180))}
            y2={120 + 70 * Math.sin((minutesRotation - 90) * (Math.PI / 180))}
            stroke="#1f2937"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Seconds hand */}
          <line
            x1="120"
            y1="120"
            x2={120 + 75 * Math.cos((secondsRotation - 90) * (Math.PI / 180))}
            y2={120 + 75 * Math.sin((secondsRotation - 90) * (Math.PI / 180))}
            stroke="#dc2626"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
