import { useState, useRef } from "react";
import { Clock, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

// Generate time options every 30 minutes
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayStr = `${hour.toString().padStart(2, '0')}h${minute === 0 ? '00' : '30'}`;
      options.push({ value: timeStr, label: displayStr });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function TimeInput({ value, onChange, className = "", disabled = false }: TimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTimeSelect = (selectedTime: string) => {
    onChange(selectedTime);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  // Find the display label for current value
  const currentOption = TIME_OPTIONS.find(opt => opt.value === value);
  const displayValue = currentOption ? currentOption.label : value;

  return (
    <div className={`relative ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              <Clock className="h-4 w-4" />
            </span>
            <Input
              ref={inputRef}
              type="time"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onClick={handleInputClick}
              disabled={disabled}
              className="h-12 pl-10 pr-10 cursor-pointer"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(!isOpen);
              }}
              disabled={disabled}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Horários Disponíveis
            </div>
            <ScrollArea className="h-64">
              {TIME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className="w-full justify-start h-8 px-2 font-mono"
                  onClick={() => handleTimeSelect(option.value)}
                >
                  <Clock className="h-3 w-3 mr-2" />
                  {option.label}
                </Button>
              ))}
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}