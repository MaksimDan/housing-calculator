import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Play, Pause } from 'lucide-react';

export const AnimatedInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  animationStep = step / 10,
  animationInterval = 50
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef(null);
  
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const animate = useCallback(() => {
    const nextValue = value + animationStep;
    if (nextValue > max) {
      onChange(min);
      stopAnimation();
    } else {
      const roundedValue = Math.round(nextValue * 100) / 100;
      onChange(roundedValue);
    }
  }, [value, animationStep, max, min, onChange, stopAnimation]);

  const togglePlay = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      animate();
      animationRef.current = setInterval(animate, animationInterval);
    }
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, animate, animationInterval]);

  useEffect(() => {
    if (value >= max && isPlaying) {
      stopAnimation();
      onChange(min);
    }
  }, [value, max, min, isPlaying, onChange, stopAnimation]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <button
          onClick={togglePlay}
          className="rounded p-2 text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 ease-in-out"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default AnimatedInput;