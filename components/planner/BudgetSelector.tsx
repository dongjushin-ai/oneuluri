interface BudgetSelectorProps {
  budget: number;
  onSelect: (value: number) => void;
}

const budgetOptions = [
  { label: "10만원 이하", value: 100000 },
  { label: "10~20만원", value: 200000 },
  { label: "20만원+", value: 300000 },
] as const;

export default function BudgetSelector({ budget, onSelect }: BudgetSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {budgetOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
            budget === option.value
              ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
              : "border-orange-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50"
          }`}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
