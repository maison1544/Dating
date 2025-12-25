import { CreditCard, Download, Gift } from 'lucide-react';
import { useState } from 'react';

export function PaymentHistoryPage() {
  const [activeTab, setActiveTab] = useState<'charge' | 'withdraw' | 'gift'>('charge');

  const chargeHistory = [
    { id: 1, date: '2025-12-14 14:32:15', amount: 5000, status: '완료' },
    { id: 2, date: '2025-12-13 09:21:43', amount: 10000, status: '완료' },
    { id: 3, date: '2025-12-12 18:45:22', amount: 1000, status: '처리중' },
    { id: 4, date: '2025-12-11 16:15:30', amount: 3000, status: '완료' },
    { id: 5, date: '2025-12-10 11:22:18', amount: 20000, status: '완료' },
  ];

  const withdrawHistory = [
    { id: 1, date: '2025-12-14 16:20:35', amount: 50000, status: '처리중' },
    { id: 2, date: '2025-12-10 11:15:48', amount: 30000, status: '완료' },
    { id: 3, date: '2025-12-08 09:30:22', amount: 20000, status: '완료' },
    { id: 4, date: '2025-12-05 14:45:10', amount: 15000, status: '완료' },
  ];

  const giftHistory = [
    { id: 1, date: '2025-12-14 18:30:22', type: '선물', target: '소희님에게', item: '장미', amount: 100 },
    { id: 2, date: '2025-12-14 15:22:18', type: '구매', target: '기프트샵', item: '초콜릿', amount: -300 },
    { id: 3, date: '2025-12-13 20:15:33', type: '판매', target: '기프트샵', item: '하트 풍선', amount: 160 },
    { id: 4, date: '2025-12-13 14:50:10', type: '선물', target: '유진님에게', item: '샴페인', amount: 500 },
    { id: 5, date: '2025-12-12 11:25:44', type: '구매', target: '기프트샵', item: '장미', amount: -100 },
  ];

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl text-white mb-2">충전/출금 내역</h1>
          <p className="text-gray-400">모든 포인트 거래 내역을 확인하세요</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('charge')}
            className={`px-6 py-3 flex items-center gap-2 transition-colors ${
              activeTab === 'charge'
                ? 'text-pink-500 border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard size={20} />
            <span>충전 내역</span>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-6 py-3 flex items-center gap-2 transition-colors ${
              activeTab === 'withdraw'
                ? 'text-pink-500 border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Download size={20} />
            <span>출금 내역</span>
          </button>
          <button
            onClick={() => setActiveTab('gift')}
            className={`px-6 py-3 flex items-center gap-2 transition-colors ${
              activeTab === 'gift'
                ? 'text-pink-500 border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gift size={20} />
            <span>기프트 내역</span>
          </button>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          {activeTab === 'charge' ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">날짜</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">충전액</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-400 uppercase w-20">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {chargeHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-xs text-gray-400">{item.date}</td>
                        <td className="px-3 py-2 text-sm text-green-500 text-right">+{item.amount.toLocaleString()} P</td>
                        <td className="px-3 py-2 text-sm text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === '완료' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'withdraw' ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">날짜</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase">금액</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-400 uppercase w-20">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {withdrawHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-xs text-gray-400">{item.date}</td>
                        <td className="px-3 py-2 text-sm text-white text-right">{item.amount.toLocaleString()}원</td>
                        <td className="px-3 py-2 text-sm text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.status === '완료' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">날짜</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">구분</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 uppercase">상세</th>
                      <th className="px-3 py-2 text-right text-xs text-gray-400 uppercase w-24">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {giftHistory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{item.date}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.type === '선물' ? 'bg-pink-500/20 text-pink-500' : 
                            item.type === '구매' ? 'bg-blue-500/20 text-blue-500' : 
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-300">
                          {item.item} <span className="text-gray-500">({item.target})</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-right">
                          <span className={item.amount > 0 ? 'text-green-500' : 'text-red-500'}>
                            {item.amount > 0 ? '+' : ''}{item.amount} P
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}