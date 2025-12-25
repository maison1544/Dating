import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, History, X } from 'lucide-react';

export function DiceGamePage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [betAmount, setBetAmount] = useState('');
  const [currentPoints] = useState(5000);
  const [selectedBet, setSelectedBet] = useState<{type: string, label: string, odds: number} | null>(null);
  
  // 일반볼 5개 (0-130)
  const [normalBalls, setNormalBalls] = useState([27, 1, 3, 22, 24]);
  // 파워볼 1개 (0-9)
  const [powerBall, setPowerBall] = useState(8);
  
  const [isRolling, setIsRolling] = useState(false);
  const [showBetConfirm, setShowBetConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [currentRound, setCurrentRound] = useState(1235);

  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: '유저123', message: '이번엔 일반볼 홀이다!', time: '01:25' },
    { id: 2, user: '럭키걸', message: '파워볼 오버 가즈아~', time: '01:23' },
  ]);

  const [myBets] = useState([
    { id: 1, type: '일반볼-홀', amount: 1000, result: '승', round: 1234, betTime: '14:32', winAmount: 1950 },
    { id: 2, type: '파워볼-언더', amount: 500, result: '패', round: 1233, betTime: '14:29', winAmount: 0 },
    { id: 3, type: '일반볼-오버', amount: 2000, result: '승', round: 1232, betTime: '14:26', winAmount: 3900 },
  ]);

  const [gameResults] = useState([
    { round: 1234, normalBalls: [27, 1, 3, 22, 24], normalSum: 77, powerBall: 8, normalOddEven: '홀', normalUnderOver: '오버', powerOddEven: '짝', powerUnderOver: '오버' },
    { round: 1233, normalBalls: [15, 20, 8, 12, 16], normalSum: 71, powerBall: 3, normalOddEven: '홀', normalUnderOver: '언더', powerOddEven: '홀', powerUnderOver: '언더' },
    { round: 1232, normalBalls: [45, 32, 18, 9, 6], normalSum: 110, powerBall: 7, normalOddEven: '짝', normalUnderOver: '오버', powerOddEven: '홀', powerUnderOver: '오버' },
    { round: 1231, normalBalls: [12, 5, 28, 14, 11], normalSum: 70, powerBall: 2, normalOddEven: '짝', normalUnderOver: '언더', powerOddEven: '짝', powerUnderOver: '언더' },
    { round: 1230, normalBalls: [50, 25, 33, 19, 7], normalSum: 134, powerBall: 6, normalOddEven: '짝', normalUnderOver: '오버', powerOddEven: '짝', powerUnderOver: '오버' },
    { round: 1229, normalBalls: [18, 42, 9, 11, 35], normalSum: 115, powerBall: 5, normalOddEven: '홀', normalUnderOver: '오버', powerOddEven: '홀', powerUnderOver: '오버' },
    { round: 1228, normalBalls: [8, 13, 27, 19, 4], normalSum: 71, powerBall: 1, normalOddEven: '홀', normalUnderOver: '언더', powerOddEven: '홀', powerUnderOver: '언더' },
  ]);

  const betOptions = {
    normalOdd: { label: '일반볼-홀', odds: 1.95, color: 'red' },
    normalEven: { label: '일반볼-짝', odds: 1.95, color: 'blue' },
    normalUnder: { label: '일반볼-언더', odds: 1.95, color: 'purple' },
    normalOver: { label: '일반볼-오버', odds: 1.95, color: 'orange' },
    powerOdd: { label: '파워볼-홀', odds: 1.95, color: 'red' },
    powerEven: { label: '파워볼-짝', odds: 1.95, color: 'blue' },
    powerUnder: { label: '파워볼-언더', odds: 1.95, color: 'purple' },
    powerOver: { label: '파워볼-오버', odds: 1.95, color: 'orange' },
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          rollBalls();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const rollBalls = () => {
    setIsRolling(true);
    let count = 0;
    const rollInterval = setInterval(() => {
      setNormalBalls(Array.from({ length: 5 }, () => Math.floor(Math.random() * 131)));
      setPowerBall(Math.floor(Math.random() * 10));
      count++;
      if (count >= 20) {
        clearInterval(rollInterval);
        setIsRolling(false);
        setCurrentRound(prev => prev + 1);
      }
    }, 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const handleBet = (type: keyof typeof betOptions) => {
    if (!betAmount || parseInt(betAmount) <= 0) {
      alert('베팅 금액을 입력해주세요');
      return;
    }
    const option = betOptions[type];
    setSelectedBet({ type, label: option.label, odds: option.odds });
    setShowBetConfirm(true);
  };

  const confirmBet = () => {
    alert(`${selectedBet?.label}에 ${parseInt(betAmount).toLocaleString()}P 배팅이 완료되었습니다!`);
    setShowBetConfirm(false);
    setSelectedBet(null);
    setBetAmount('');
  };

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    const newMessage = {
      id: chatMessages.length + 1,
      user: '나',
      message: chatMessage,
      time: formatTime(timeLeft),
    };
    setChatMessages([...chatMessages, newMessage]);
    setChatMessage('');
  };

  const normalSum = normalBalls.reduce((a, b) => a + b, 0);
  const expectedWin = selectedBet && betAmount ? Math.floor(parseInt(betAmount) * selectedBet.odds) : 0;

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/mini-game')}
          className="flex items-center gap-2 text-gray-400 hover:text-pink-500 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>돌아가기</span>
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-2">
            💕 <span className="text-pink-500">동행복권 파워볼 5분</span> 💕
          </h1>
          <p className="text-gray-400 text-sm">5분 단위로 추첨, 총 288회차 진행</p>
          <p className="text-gray-500 text-xs mt-1">현재 회차: #{currentRound}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Ball Display */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-8 border border-blue-500/30">
              <h3 className="text-white text-center mb-4">일반볼 (0~130)</h3>
              <div className="flex items-center justify-center gap-4 mb-6">
                {normalBalls.map((ball, idx) => (
                  <div key={idx} className="text-center">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg ${isRolling ? 'animate-bounce' : ''}`}>
                      <span className="text-white text-2xl">{ball}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mb-6">
                <span className="text-gray-400">합계: </span>
                <span className="text-white text-2xl">{normalSum}</span>
              </div>

              <h3 className="text-white text-center mb-4">파워볼 (0~9)</h3>
              <div className="flex items-center justify-center">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl ${isRolling ? 'animate-spin' : ''}`}>
                  <span className="text-white text-3xl">{powerBall}</span>
                </div>
              </div>
            </div>

            {/* Timer and Bet */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="bg-pink-500 text-white px-4 py-1 rounded-full text-sm">
                    {currentRound}회차
                  </span>
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm">
                    배팅 중
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-6xl text-white mb-2">{formatTime(timeLeft)}</p>
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-1000"
                      style={{ width: `${(timeLeft / 300) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span className="text-white">다음 추첨까지</span>
                    <span>5:00</span>
                  </div>
                </div>
              </div>

              {/* Bet Amount */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">💰</span>
                  <span className="text-white">보유 포인트</span>
                  <span className="text-yellow-500 ml-auto">{currentPoints.toLocaleString()}P</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={betAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setBetAmount(value);
                    }}
                    placeholder="배팅 금액 입력"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleQuickAmount(5000)}
                    className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
                  >
                    5천
                  </button>
                  <button
                    onClick={() => handleQuickAmount(10000)}
                    className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
                  >
                    1만
                  </button>
                  <button
                    onClick={() => handleQuickAmount(50000)}
                    className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
                  >
                    5만
                  </button>
                  <button
                    onClick={() => handleQuickAmount(100000)}
                    className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
                  >
                    10만
                  </button>
                  <button
                    onClick={() => setBetAmount(currentPoints.toString())}
                    className="flex-1 bg-gray-800 text-white py-2 rounded hover:bg-gray-700 text-sm"
                  >
                    올인
                  </button>
                </div>
              </div>

              {/* 일반볼 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center">일반볼 배팅 (5개 합계 기준)</h3>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    onClick={() => handleBet('normalOdd')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                  >
                    <div>홀</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('normalEven')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                  >
                    <div>짝</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet('normalUnder')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                  >
                    <div>언더 (기준 72.5)</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('normalOver')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600"
                  >
                    <div>오버 (기준 72.5)</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                </div>
              </div>

              {/* 파워볼 배팅 */}
              <div>
                <h3 className="text-white mb-2 text-center">파워볼 배팅 (파워볼 숫자 기준)</h3>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    onClick={() => handleBet('powerOdd')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                  >
                    <div>홀</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('powerEven')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                  >
                    <div>짝</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet('powerUnder')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                  >
                    <div>언더 (기준 4.5)</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('powerOver')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600"
                  >
                    <div>오버 (기준 4.5)</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel - Game Results Dashboard */}
          <div className="space-y-4">
            {/* Game Results */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">📊</span>
                  <span className="text-white">회차별 결과</span>
                </div>
              </div>
              <div className="p-4 max-h-[700px] overflow-y-auto">
                <div className="space-y-3">
                  {gameResults.map((result) => (
                    <div
                      key={result.round}
                      className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-xs">#{result.round}회</span>
                      </div>
                      
                      {/* 일반볼 5개 + 파워볼 */}
                      <div className="mb-3">
                        <div className="flex gap-1 mb-2 items-center">
                          {result.normalBalls.map((ball, i) => (
                            <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                              <span className="text-white text-xs">{ball}</span>
                            </div>
                          ))}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center ml-2">
                            <span className="text-white text-sm">{result.powerBall}</span>
                          </div>
                        </div>
                        
                        {/* 일반볼 결과 */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs">일반볼 합: {result.normalSum}</span>
                            <div className="flex gap-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                result.normalOddEven === '홀' 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {result.normalOddEven}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                result.normalUnderOver === '오버' 
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}>
                                {result.normalUnderOver}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 파워볼 결과 */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs">파워볼: {result.powerBall}</span>
                            <div className="flex gap-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                result.powerOddEven === '홀' 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {result.powerOddEven}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                result.powerUnderOver === '오버' 
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}>
                                {result.powerUnderOver}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Chat Button */}
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 left-6 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-all hover:scale-110 z-40"
        >
          <MessageCircle size={24} />
        </button>

        {/* Floating Bet History Button */}
        <button
          onClick={() => setShowBetHistory(true)}
          className="fixed bottom-6 left-6 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110 z-40"
        >
          <History size={24} />
        </button>
      </div>

      {/* Bet Confirmation Modal */}
      {showBetConfirm && selectedBet && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full">
            <h3 className="text-white text-xl mb-4">배팅 확인</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배팅 항목</span>
                <span className="text-white">{selectedBet.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배팅 금액</span>
                <span className="text-white">{parseInt(betAmount).toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">배당률</span>
                <span className="text-yellow-500">{selectedBet.odds}배</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">예상 당첨금</span>
                <span className="text-pink-500 text-lg">{expectedWin.toLocaleString()}P</span>
              </div>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
              <p className="text-red-400 text-sm text-center">
                ⚠️ 배팅 후 취소가 불가합니다!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBetConfirm(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmBet}
                className="flex-1 bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors"
              >
                배팅하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full">
            <div className="bg-pink-500/20 border-b border-pink-500/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-pink-500">💬</span>
                <span className="text-white">채팅</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="h-[400px] overflow-y-auto mb-3 space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="text-gray-400">{msg.time} </span>
                    <span className="text-pink-400">{msg.user}:</span>
                    <span className="text-white ml-1">{msg.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="메시지 입력..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-pink-500"
                />
                <button
                  onClick={handleSendChat}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bet History Modal */}
      {showBetHistory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full">
            <div className="bg-blue-500/20 border-b border-blue-500/30 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">📊</span>
                <span className="text-white">배팅 기록</span>
              </div>
              <button onClick={() => setShowBetHistory(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {myBets.map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">{bet.type}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        bet.result === '승' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {bet.result}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">회차: </span>
                        <span className="text-white">#{bet.round}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">배팅시간: </span>
                        <span className="text-white">{bet.betTime}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">배팅금액: </span>
                        <span className="text-white">{bet.amount.toLocaleString()}P</span>
                      </div>
                      <div>
                        <span className="text-gray-400">당첨금액: </span>
                        <span className={bet.winAmount > 0 ? 'text-green-400' : 'text-gray-500'}>
                          {bet.winAmount.toLocaleString()}P
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}