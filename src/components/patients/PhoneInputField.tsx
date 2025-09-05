import PhoneInput from 'react-phone-number-input';
import { cn } from "@/lib/utils";
import 'react-phone-number-input/style.css';

interface PhoneInputFieldProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInputField({ 
  value, 
  onChange, 
  placeholder = "WhatsApp com código do país",
  className,
  disabled 
}: PhoneInputFieldProps) {
  return (
    <div className="phone-input-wrapper">
      <PhoneInput
        international
        defaultCountry="BR"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("h-12 text-base border border-input bg-background px-3 py-2 rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}
        disabled={disabled}
        countrySelectProps={{
          className: "country-select"
        }}
        inputProps={{
          className: "phone-number-input"
        }}
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .phone-input-wrapper .PhoneInput {
            display: flex;
            align-items: center;
            width: 100%;
          }
          
          .phone-input-wrapper .PhoneInputCountry {
            margin-right: 8px;
            display: flex;
            align-items: center;
          }
          
          .phone-input-wrapper .PhoneInputCountryIcon {
            margin-right: 4px;
            width: 20px;
            height: 15px;
            border: 1px solid hsl(var(--border));
            border-radius: 2px;
          }
          
          .phone-input-wrapper .PhoneInputCountrySelect {
            background: transparent;
            border: none;
            font-size: 14px;
            margin-right: 4px;
            cursor: pointer;
            color: hsl(var(--foreground));
          }
          
          .phone-input-wrapper .PhoneInputCountrySelect:focus {
            outline: none;
          }
          
          .phone-input-wrapper .PhoneInputInput {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-size: 16px;
            padding: 0;
            color: hsl(var(--foreground));
          }
          
          .phone-input-wrapper .PhoneInputInput::placeholder {
            color: hsl(var(--muted-foreground));
          }
        `
      }} />
    </div>
  );
}