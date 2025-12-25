import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MessageCircle, History, X } from 'lucide-react';

export function LadderGamePage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [betAmount, setBetAmount] = useState('');
  const [currentPoints] = useState(5000);
  const [selectedBet, setSelectedBet] = useState<{type: string, label: string, odds: number} | null>(null);
  
  // 사다리 결과 (출발: 좌/우, 도착: 홀/짝, 줄수: 3 or 4)
  const [ladderResult, setLadderResult] = useState({
    start: '좌', // 좌 or 우
    end: '홀', // 홀 or 짝
    lines: 4, // 3 or 4
  });
  
  const [isRolling, setIsRolling] = useState(false);
  const [showBetConfirm, setShowBetConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBetHistory, setShowBetHistory] = useState(false);
  const [currentRound, setCurrentRound] = useState(1235);

  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: '유저123', message: '이번엔 좌출발이다!', time: '01:25' },
    { id: 2, user: '럭키걸', message: '4줄 홀 가즈아~', time: '01:23' },
  ]);

  const [myBets] = useState([
    { id: 1, type: '좌출발', amount: 1000, result: '승', round: 1234, betTime: '14:32', winAmount: 1950 },
    { id: 2, type: '3줄', amount: 500, result: '패', round: 1233, betTime: '14:29', winAmount: 0 },
    { id: 3, type: '홀', amount: 2000, result: '승', round: 1232, betTime: '14:26', winAmount: 3900 },
    { id: 4, type: '좌3홀', amount: 1500, result: '승', round: 1231, betTime: '14:20', winAmount: 5250 },
  ]);

  const [gameResults] = useState([
    { round: 1234, start: '좌', end: '홀', lines: 4 },
    { round: 1233, start: '우', end: '짝', lines: 3 },
    { round: 1232, start: '좌', end: '홀', lines: 4 },
    { round: 1231, start: '우', end: '짝', lines: 3 },
    { round: 1230, start: '좌', end: '홀', lines: 4 },
    { round: 1229, start: '우', end: '홀', lines: 3 },
    { round: 1228, start: '좌', end: '짝', lines: 4 },
    { round: 1227, start: '우', end: '짝', lines: 3 },
  ]);

  const betOptions = {
    leftStart: { label: '좌출발', odds: 1.95, color: 'red' },
    rightStart: { label: '우출발', odds: 1.95, color: 'blue' },
    line3: { label: '3줄', odds: 1.95, color: 'purple' },
    line4: { label: '4줄', odds: 1.95, color: 'orange' },
    oddEnd: { label: '홀', odds: 1.95, color: 'red' },
    evenEnd: { label: '짝', odds: 1.95, color: 'blue' },
    // 묶음 배팅 (3개 조건 모두 맞추기)
    left3Even: { label: '좌3짝', odds: 3.5, color: 'pink' },
    left4Odd: { label: '좌4홀', odds: 3.5, color: 'cyan' },
    right3Odd: { label: '우3홀', odds: 3.5, color: 'green' },
    right4Even: { label: '우4짝', odds: 3.5, color: 'yellow' },
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          runLadder();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const runLadder = () => {
    setIsRolling(true);
    let count = 0;
    const rollInterval = setInterval(() => {
      setLadderResult({
        start: Math.random() > 0.5 ? '좌' : '우',
        end: Math.random() > 0.5 ? '홀' : '짝',
        lines: Math.random() > 0.5 ? 3 : 4,
      });
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

  const expectedWin = selectedBet && betAmount ? Math.floor(parseInt(betAmount) * selectedBet.odds) : 0;

  // 사다리 그리기
  const renderLadder = () => {
    const lines = ladderResult.lines;
    
    return (
      <div className="relative w-full max-w-lg mx-auto">
        {/* 시작점 */}
        <div className="flex justify-around mb-6">
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              ladderResult.start === '좌' && !isRolling
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-gray-700 text-gray-400'
            }`}>
              <span className="text-lg">좌</span>
            </div>
            <div className="w-1 h-12 bg-gray-600 mt-2"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              ladderResult.start === '우' && !isRolling
                ? 'bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50'
                : 'bg-gray-700 text-gray-400'
            }`}>
              <span className="text-lg">우</span>
            </div>
            <div className="w-1 h-12 bg-gray-600 mt-2"></div>
          </div>
        </div>

        {/* 사다리 중간 부분 */}
        <div className="bg-gray-800/50 rounded-lg p-8 mb-6">
          <div className="flex justify-center items-center gap-2 text-white text-sm mb-4">
            <span className="text-gray-400">중간 줄수:</span>
            <span className={`px-4 py-1 rounded text-lg ${
              lines === 3 ? 'bg-purple-500' : 'bg-orange-500'
            }`}>
              {lines}줄
            </span>
          </div>
          {/* 사다리 시각화 */}
          <div className="relative h-40">
            {/* 세로 라인 */}
            <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-600"></div>
            <div className="absolute right-1/4 top-0 bottom-0 w-1 bg-gray-600"></div>
            
            {/* 가로 라인 (줄수만큼) */}
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={`absolute left-1/4 right-1/4 h-1 ${
                  isRolling ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500' : 'bg-pink-500'
                }`}
                style={{ top: `${(i + 1) * (100 / (lines + 1))}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* 도착점 */}
        <div className="flex justify-around">
          <div className="flex flex-col items-center">
            <div className="w-1 h-12 bg-gray-600 mb-2"></div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              ladderResult.end === '홀' && !isRolling
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-gray-700 text-gray-400'
            }`}>
              <span className="text-lg">홀</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-1 h-12 bg-gray-600 mb-2"></div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              ladderResult.end === '짝' && !isRolling
                ? 'bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/50'
                : 'bg-gray-700 text-gray-400'
            }`}>
              <span className="text-lg">짝</span>
            </div>
          </div>
        </div>

        {/* 결과 표시 */}
        {!isRolling && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-3">최종 결과</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <span className={`px-4 py-2 rounded-lg text-sm ${
                ladderResult.start === '좌' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {ladderResult.start}출발
              </span>
              <span className={`px-4 py-2 rounded-lg text-sm ${
                ladderResult.lines === 3 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {ladderResult.lines}줄
              </span>
              <span className={`px-4 py-2 rounded-lg text-sm ${
                ladderResult.end === '홀' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {ladderResult.end}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

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
            💕 <span className="text-pink-500">사다리 게임 5분</span> 💕
          </h1>
          <p className="text-gray-400 text-sm">5분 단위로 진행되는 사다리 게임 (3줄 or 4줄)</p>
          <p className="text-gray-500 text-xs mt-1">현재 회차: #{currentRound}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Ladder Display */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-8 border border-purple-500/30">
              <h3 className="text-white text-center mb-6 text-xl">🎲 사다리 게임</h3>
              {renderLadder()}
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
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-1000"
                      style={{ width: `${(timeLeft / 300) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span className="text-white">다음 게임까지</span>
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

              {/* 출발방향 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center text-sm">1. 출발지점 맞추기</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet('leftStart')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                  >
                    <div>좌출발</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('rightStart')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                  >
                    <div>우출발</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                </div>
              </div>

              {/* 중간 줄수 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center text-sm">2. 줄갯수 맞추기</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet('line3')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600"
                  >
                    <div>3줄</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('line4')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600"
                  >
                    <div>4줄</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                </div>
              </div>

              {/* 홀짝 배팅 */}
              <div className="mb-4">
                <h3 className="text-white mb-2 text-center text-sm">3. 홀짝 맞추기 (최종 도착)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet('oddEnd')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                  >
                    <div>홀</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('evenEnd')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
                  >
                    <div>짝</div>
                    <div className="text-xs mt-1">(1.95배)</div>
                  </button>
                </div>
              </div>

              {/* 묶음 배팅 */}
              <div>
                <h3 className="text-white mb-2 text-center text-sm">4. 묶어서 맞추기 (3개 조건 모두)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBet('left3Even')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600"
                  >
                    <div>좌3짝</div>
                    <div className="text-xs mt-1">(3.5배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('left4Odd')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600"
                  >
                    <div>좌4홀</div>
                    <div className="text-xs mt-1">(3.5배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('right3Odd')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600"
                  >
                    <div>우3홀</div>
                    <div className="text-xs mt-1">(3.5배)</div>
                  </button>
                  <button
                    onClick={() => handleBet('right4Even')}
                    className="py-3 rounded-lg text-white transition-all bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600"
                  >
                    <div>우4짝</div>
                    <div className="text-xs mt-1">(3.5배)</div>
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
                      
                      {/* 결과 */}
                      <div className="mb-2">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded text-sm ${
                            result.start === '좌' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {result.start}출발
                          </span>
                          <span className={`px-3 py-1 rounded text-sm ${
                            result.lines === 3 
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          }`}>
                            {result.lines}줄
                          </span>
                          <span className={`px-3 py-1 rounded text-sm ${
                            result.end === '홀' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {result.end}
                          </span>
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