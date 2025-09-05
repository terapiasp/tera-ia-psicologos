import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  stepMinutes?: number;
}

export const TimeInput = ({ value, onChange, className, stepMinutes = 30 }: TimeInputProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Generate time options with specified step
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += stepMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative">
          <Input
            type="time"
            value={value}
            onChange={handleDirectInput}
            className={`${className} pr-10`}
            placeholder="--:--"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Clock className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
        
        <PopoverContent className="w-48 p-0 bg-background border shadow-lg" align="start">
          <ScrollArea className="h-60">
            <div className="p-1">
              {timeOptions.map((time) => (
                <Button
                  key={time}
                  variant={time === value ? "default" : "ghost"}
                  className="w-full justify-start text-sm h-8 mb-1"
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};