import React from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  stepMinutes?: number;
}

export const TimeInput = ({ value, onChange, className, stepMinutes = 30 }: TimeInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Convert stepMinutes to seconds for the step attribute
  const stepInSeconds = stepMinutes * 60;

  return (
    <Input
      type="time"
      value={value}
      onChange={handleChange}
      step={stepInSeconds}
      className={`${className} cursor-pointer`}
      style={{
        // Improve UX for time selection
        WebkitAppearance: 'none',
        MozAppearance: 'textfield',
      }}
    />
  );
};