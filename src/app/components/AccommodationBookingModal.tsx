import { X, Calendar, Users, Check } from "lucide-react";
import { useState } from "react";
import { useAlert } from "../contexts/AlertContext";

interface AccommodationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodation: {
    name: string;
    price: number;
  };
}

export function AccommodationBookingModal({
  isOpen,
  onClose,
  accommodation,
}: AccommodationBookingModalProps) {
  const [date, setDate] = useState("");
  const [people, setPeople] = useState("2");
  const { showAlert } = useAlert();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 예약 로직
    showAlert({
      title: "예약 완료",
      message: "예약이 완료되었습니다!",
      type: "success",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-lg max-w-md w-full mx-4 border border-gray-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-white text-2xl mb-2">숙소 예약</h2>
          <p className="text-gray-400 text-sm">{accommodation.name}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">날짜</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                required
              />
              <Calendar
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* People */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">인원</label>
            <select
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500 appearance-none"
            >
              <option value="1">1명</option>
              <option value="2">2명</option>
              <option value="3">3명</option>
              <option value="4">4명</option>
            </select>
            <Users
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Price */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">1박 요금</span>
              <span className="text-white">
                {accommodation.price.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-white">총 금액</span>
              <span className="text-pink-500 text-xl">
                {accommodation.price.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Check size={16} className="text-pink-500 mt-0.5 shrink-0" />
              <p className="text-pink-300 text-sm">
                예약 확정 후 변경/취소 시 수수료가 발생할 수 있습니다
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
            >
              예약하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
