import { useLocation } from "react-router-dom";
import Logo from "../../imports/Logo";

export function Footer() {
  const routerLocation = useLocation();

  // 채팅방 페이지에서는 푸터를 숨김
  if (routerLocation.pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <footer className="bg-black border-t border-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Logo */}
        <div className="mb-2">
          <div className="flex flex-col items-center">
            <div className="mb-2">
              <div className="h-14 w-[220px]">
                <Logo />
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="border-t border-gray-900 pt-4">
          <div className="text-gray-400 text-sm space-y-2 text-center">
            <p>법인명(상호) : 솔루션 스튜디오</p>
            <p>대표자(성명) : 솔루션 스튜디오</p>
            <p>전화 : 010-9999-9999</p>
            <p>주소 : 서울특별시 은평구 35678</p>
            <p>사업자 등록번호 안내 : 999-99-99999</p>
            <p>통신판매업 신고 : 제2025-서울은평-9999호</p>
            <p>개인정보보호책임 : 솔루션 스튜디오 (solution@gmail.com)</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-900 pt-6 mt-6 text-center text-gray-500 text-sm">
          <p>© 2025 솔루션스튜디오. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
