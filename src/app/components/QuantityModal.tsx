import { X, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

interface QuantityModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemEmoji: string;
  price: number;
  maxQuantity?: number;
  currentPoints?: number;
  isBuying?: boolean;
  isSelling?: boolean;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

export function QuantityModal({ 
  isOpen, 
  title, 
  itemName, 
  itemEmoji, 
  price, 
  maxQuantity = 99,
  currentPoints = 0,
  isBuying = false,
  isSelling = false,
  onConfirm, 
  onCancel 
}: QuantityModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const totalPrice = price * quantity;
  const maxAffordable = isBuying ? Math.floor(currentPoints / price) : maxQuantity;
  const actualMaxQuantity = isBuying ? Math.min(maxAffordable, maxQuantity) : maxQuantity;

  const handleIncrease = () => {
    if (quantity < actualMaxQuantity) setQuantity(quantity + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-lg max-w-md w-full mx-4 border border-gray-800 p-6">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <h3 className="text-white text-xl mb-4">{title}</h3>
        
        {/* Item Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <div className="text-5xl mb-2">{itemEmoji}</div>
          <p className="text-white mb-1">{itemName}</p>
          <p className="text-pink-500">{price.toLocaleString()} P</p>
        </div>

        {/* Current Points - Show when buying or selling */}
        {(isBuying || isSelling) && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">보유 포인트</span>
              <span className="text-white font-bold">{currentPoints.toLocaleString()} P</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-400">{isBuying ? '구매 가능 수량' : '판매 가능 수량'}</span>
              <span className="text-green-500 font-bold">{isBuying ? maxAffordable : maxQuantity}개</span>
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">수량</label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus size={20} className="text-white" />
            </button>
            
            <div className="bg-gray-800 px-8 py-3 rounded-lg min-w-[80px] text-center">
              <span className="text-white text-xl font-bold">{quantity}</span>
            </div>
            
            <button
              onClick={handleIncrease}
              disabled={quantity >= actualMaxQuantity}
              className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Total Price */}
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-400 text-sm mb-1">총 금액</p>
          <p className="text-pink-500 text-2xl font-bold">{totalPrice.toLocaleString()} P</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(quantity)}
            className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}