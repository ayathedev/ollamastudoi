import React from 'react';

interface SpeakingVisualizerProps {
  isActive: boolean;
}

export const SpeakingVisualizer: React.FC<SpeakingVisualizerProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-1 h-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-orange-500 rounded-full animate-[bounce_0.8s_infinite]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};
