import { Slider } from "@/components/ui/slider";

interface PreferenceSliderProps {
  label: string;
  value: number;
  maxLabel: string;
  onChange: (value: number) => void;
}

export default function PreferenceSlider({
  label,
  value,
  maxLabel,
  onChange,
}: PreferenceSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-orange-600">{value}/5</span>
      </div>
      <Slider
        min={0}
        max={5}
        step={1}
        value={[value]}
        onValueChange={(newValue) => {
          const nextValue = Array.isArray(newValue) ? newValue[0] : value;
          onChange(nextValue);
        }}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>낮음</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
