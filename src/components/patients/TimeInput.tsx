import React from 'react';
import { Input } from '@/components/ui/input';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const TimeInput = ({ value, onChange, className }: TimeInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <Input
      type="time"
      value={value}
      onChange={handleChange}
      className={className}
    />
  );
};