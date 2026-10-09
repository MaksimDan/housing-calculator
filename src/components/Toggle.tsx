import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  id?: string;
  describedBy?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, id, describedBy }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        checked ? 'bg-blue-600' : 'bg-gray-400'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5 ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
    <span className="text-sm text-gray-800 select-none">{label}</span>
  </label>
);
