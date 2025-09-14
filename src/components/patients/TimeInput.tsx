import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const TimeInput = ({ value, onChange, className }: TimeInputProps) => {
  const [hour, setHour] = useState<string>('9');
  const [minute, setMinute] = useState<string>('00');
  const [period, setPeriod] = useState<string>('AM');

  // Parse time string (HH:MM format) into components
  useEffect(() => {
    if (value) {
      const [timeStr] = value.split(':');
      const hourNum = parseInt(timeStr);
      const minuteNum = parseInt(value.split(':')[1] || '0');
      
      if (hourNum === 0) {
        setHour('12');
        setPeriod('AM');
      } else if (hourNum === 12) {
        setHour('12');
        setPeriod('PM');
      } else if (hourNum > 12) {
        setHour((hourNum - 12).toString());
        setPeriod('PM');
      } else {
        setHour(hourNum.toString());
        setPeriod('AM');
      }
      
      setMinute(minuteNum.toString().padStart(2, '0'));
    }
  }, [value]);

  // Convert AM/PM time to 24h format
  const updateTime = (newHour: string, newMinute: string, newPeriod: string) => {
    let hour24 = parseInt(newHour);
    
    if (newPeriod === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (newPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }
    
    const formattedHour = hour24.toString().padStart(2, '0');
    const formattedMinute = newMinute.padStart(2, '0');
    
    onChange(`${formattedHour}:${formattedMinute}`);
  };

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    updateTime(newHour, minute, period);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newMinute = e.target.value;
    
    // Validação inteligente para minutos
    if (newMinute === '') {
      newMinute = '00';
    } else {
      const minuteNum = parseInt(newMinute);
      if (minuteNum > 59) {
        newMinute = '59';
      } else if (minuteNum < 0) {
        newMinute = '00';
      } else {
        newMinute = minuteNum.toString().padStart(2, '0');
      }
    }
    
    setMinute(newMinute);
    updateTime(hour, newMinute, period);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    updateTime(hour, minute, newPeriod);
  };

  const hourOptions = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' },
  ];

  return (
    <div className={className}>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Horário</Label>
          <div className="flex gap-2">
            <Select value={hour} onValueChange={handleHourChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Hora" />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Minutos</Label>
          <Input
            type="number"
            min="0"
            max="59"
            value={minute}
            onChange={handleMinuteChange}
            placeholder="00"
            className="text-center"
          />
        </div>
      </div>
    </div>
  );
};