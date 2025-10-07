import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputFieldProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInputField({ 
  value = '', 
  onChange, 
  placeholder = "DDD + Número (apenas números)",
  className,
  disabled 
}: PhoneInputFieldProps) {
  
  const formatPhoneNumber = (input: string): string => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, '');
    // Limita a 11 dígitos (DDD + número)
    return numbers.slice(0, 11);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange?.(formatted);
  };

  return (
    <Input
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn("h-12 text-base", className)}
      disabled={disabled}
      maxLength={11}
    />
  );
}