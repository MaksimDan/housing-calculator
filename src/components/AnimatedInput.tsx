import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Plus, Minus } from 'lucide-react';

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
  const initialValueRef = useRef(value); // Store the initial value
  
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
      onChange(initialValueRef.current); // Reset to initial value instead of min
      stopAnimation();
    } else {
      const roundedValue = Math.round(nextValue * 100) / 100;
      onChange(roundedValue);
    }
  }, [value, animationStep, max, onChange, stopAnimation]);

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
      onChange(initialValueRef.current); // Reset to initial value instead of min
    }
  }, [value, max, isPlaying, onChange, stopAnimation]);

  // Update initial value ref if the value prop changes while not playing
  useEffect(() => {
    if (!isPlaying) {
      initialValueRef.current = value;
    }
  }, [value, isPlaying]);

  const increment = useCallback(() => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  }, [value, step, max, onChange]);

  const decrement = useCallback(() => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  }, [value, step, min, onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {value.toLocaleString()}{suffix}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={decrement}
          disabled={value <= min}
          className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 ease-in-out disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <button
          onClick={increment}
          disabled={value >= max}
          className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 ease-in-out disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
        >
          <Plus className="h-4 w-4" />
        </button>
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