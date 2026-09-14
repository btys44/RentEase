import { useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function PasswordInput({ value, onChange, placeholder, label, error }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className="input-field pr-16"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-brand-700 hover:underline"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}