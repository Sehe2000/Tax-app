import { formatKr } from '../tax-engine';

interface Props {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}

export function Slider({ id, label, value, min, max, step, onChange, hint }: Props) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="slider-field">
      <div className="slider-top">
        <label htmlFor={id}>{label}</label>
        <span className="val">{formatKr(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--pct' as string]: `${pct}%` }}
      />
      {hint && <div className="slider-hint">{hint}</div>}
    </div>
  );
}
