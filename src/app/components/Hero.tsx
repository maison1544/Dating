import heroImage from "figma:asset/6b272de1331c45c9017b57094f47dfa7b9354c36.png";
import { Users, Video, Eye, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-2 bg-pink-500/20 border border-pink-500 rounded-full text-pink-300 text-sm mb-6">
            💕 특별한 인연을 찾아드려요
          </div>

          <p className="text-[rgb(255,255,255)] text-lg sm:text-xl mb-8 max-w-3xl mx-auto">
            지금 이 순간, 당신을 기다리는 특별한 인연이 있어요
            💝
            <br />
            달콤한 대화로 설레는 시간을 만들어보세요!
          </p>

          <button
            onClick={() => navigate('/realtime-matching')}
            className="bg-pink-500 text-white px-8 py-4 rounded-lg text-lg hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/50"
          >
            채팅 바로가기 💕
          </button>
        </div>
      </div>
    </section>
  );
}