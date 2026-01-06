import { cn } from '@/lib/utils';

interface NutritionRingProps {
  value: number;
  max: number;
  color: string;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NutritionRing({ value, max, color, label, unit = 'g', size = 'md' }: NutritionRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizes = {
    sm: { value: 'text-sm', label: 'text-[10px]' },
    md: { value: 'text-lg', label: 'text-xs' },
    lg: { value: 'text-2xl', label: 'text-sm' },
  };

  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative', sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-semibold text-foreground', textSizes[size].value)}>
            {value}
          </span>
          <span className={cn('text-muted-foreground', textSizes[size].label)}>
            {unit}
          </span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

interface NutritionBarProps {
  value: number;
  max: number;
  color: string;
  label: string;
  unit?: string;
}

export function NutritionBar({ value, max, color, label, unit = 'g' }: NutritionBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="flex-1 min-w-[100px]">
      <p className="text-sm font-medium text-foreground text-center mb-2">{label}</p>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-sm text-muted-foreground text-center mt-2">
        {value} / {max} {unit} <span className="font-medium" style={{ color }}>({Math.round(percentage)}%)</span>
      </p>
    </div>
  );
}
