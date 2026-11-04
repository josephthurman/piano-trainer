type SegmentProps<T extends string | number> = {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
};

export function Segmented<T extends string | number>({ value, options, onChange }: SegmentProps<T>) {
  return (
    <div className="inline-flex rounded-md bg-neutral-900 border border-neutral-800 p-1">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-sm rounded ${
              selected
                ? 'bg-amber-500 text-neutral-950 font-semibold'
                : 'text-neutral-300 hover:text-neutral-100'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
