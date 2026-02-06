import { X } from "lucide-react";

export interface InventoryGift {
  id: string;
  gift_id: string;
  name: string;
  emoji: string;
  buy_price: number;
  quantity: number;
}

interface GiftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gifts: InventoryGift[];
  onSelectGift: (gift: InventoryGift) => void;
  title?: string;
  subtitle?: string;
}

export function GiftSelectionModal({
  isOpen,
  onClose,
  gifts,
  onSelectGift,
  title = "선물 보내기 💝",
  subtitle = "보낼 선물을 선택해주세요",
}: GiftSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-gray-900 rounded-lg w-full max-w-md mx-4 border border-gray-800 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-white text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 flex-1 flex flex-col justify-center overflow-y-auto">
          <p className="text-gray-400 text-sm mb-4 text-center">{subtitle}</p>
          {gifts.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400 text-sm">보유한 선물이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => onSelectGift(gift)}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all hover:scale-105 border border-gray-700 hover:border-pink-500 flex flex-col items-center justify-center"
                >
                  <div className="text-5xl mb-2">{gift.emoji}</div>
                  <p className="text-white text-sm mb-1">{gift.name}</p>
                  <p className="text-gray-400 text-xs">{gift.quantity}개</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
