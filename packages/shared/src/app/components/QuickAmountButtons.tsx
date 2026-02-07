interface QuickAmountButtonsProps {
  onAmountSelect: (amount: number) => void;
  currentPoints: number;
}

export function QuickAmountButtons({
  onAmountSelect,
  currentPoints,
}: QuickAmountButtonsProps) {
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => onAmountSelect(5000)}
        className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
      >
        5천
      </button>
      <button
        onClick={() => onAmountSelect(10000)}
        className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
      >
        1만
      </button>
      <button
        onClick={() => onAmountSelect(50000)}
        className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
      >
        5만
      </button>
      <button
        onClick={() => onAmountSelect(100000)}
        className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
      >
        10만
      </button>
      <button
        onClick={() => onAmountSelect(currentPoints)}
        className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
      >
        올인
      </button>
    </div>
  );
}
