import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSessionValues } from "@/hooks/useSessionValues";

interface SessionValueInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SessionValueInput({ 
  value, 
  onChange, 
  className = "", 
  disabled = false,
  placeholder = "80"
}: SessionValueInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { sessionValues, getNavigationValue } = useSessionValues();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentValue = parseFloat(value) || 80;

  const handleNavigation = (direction: 'next' | 'prev') => {
    const newValue = getNavigationValue(currentValue, direction);
    onChange(newValue.toString());
  };

  const handleValueSelect = (selectedValue: number) => {
    onChange(selectedValue.toString());
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium pointer-events-none z-10">
                R$
              </span>
              <Input
                ref={inputRef}
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onClick={handleInputClick}
                placeholder={placeholder}
                disabled={disabled}
                className="h-12 pl-10 pr-12 text-base cursor-pointer [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
          </PopoverTrigger>
          
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                Valores Utilizados
              </div>
              {sessionValues.map((sv) => (
                <Button
                  key={sv.value}
                  variant="ghost"
                  className="w-full justify-between h-8 px-2"
                  onClick={() => handleValueSelect(sv.value)}
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    R$ {sv.value.toFixed(2).replace('.', ',')}
                  </span>
                  {sv.count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {sv.count} {sv.count === 1 ? 'paciente' : 'pacientes'}
                    </span>
                  )}
                </Button>
              ))}
              
              {sessionValues.length === 0 && (
                <div className="text-xs text-muted-foreground px-2 py-4 text-center">
                  Nenhum valor salvo ainda
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex flex-col ml-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 w-8 p-0 rounded-b-none border-b-0"
            onClick={() => handleNavigation('next')}
            disabled={disabled || sessionValues.length === 0}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 w-8 p-0 rounded-t-none"
            onClick={() => handleNavigation('prev')}
            disabled={disabled || sessionValues.length === 0}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}