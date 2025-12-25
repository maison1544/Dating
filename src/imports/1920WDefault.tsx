import svgPaths from "./svg-k984qqz8hu";

function ContainerBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#a88a94] text-[14px] text-center text-nowrap">
        <p className="leading-[20px]">{children}</p>
      </div>
    </div>
  );
}

function SvgBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">{children}</g>
      </svg>
    </div>
  );
}
type LinkBackgroundImageAndTextProps = {
  text: string;
};

function LinkBackgroundImageAndText({ text }: LinkBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#a88a94] text-[14px] text-nowrap">
        <p className="leading-[20px]">{text}</p>
      </div>
    </div>
  );
}
type SvgLinkBackgroundImageAndTextProps = {
  text: string;
};

function SvgLinkBackgroundImageAndText({ text }: SvgLinkBackgroundImageAndTextProps) {
  return (
    <div className="bg-[rgba(41,25,30,0.5)] content-stretch flex flex-col items-start px-[20.8px] py-[10.8px] relative rounded-[9999px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[rgba(55,37,43,0.5)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(245,240,241,0.8)] text-nowrap">
        <p className="leading-[20px]">{text}</p>
      </div>
    </div>
  );
}

function Svg() {
  return (
    <div className="absolute backdrop-blur-[2px] backdrop-filter bg-[rgba(32,19,23,0.8)] content-stretch flex flex-col items-center left-0 px-[320px] py-0 top-0" data-name="Header">
      <div className="content-stretch flex flex-col items-start max-w-[1280px] min-w-[1280px] px-[32px] py-0 relative shrink-0" data-name="Container">
        <div className="content-stretch flex h-[80px] items-center justify-between relative shrink-0" data-name="Container">
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Link">
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="bg-clip-text flex flex-col font-['Gowun_Batang',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[30px] text-nowrap tracking-[1.5px]" style={{ WebkitTextFillColor: "transparent", backgroundImage: "linear-gradient(134.836deg, rgb(240, 66, 95) 0%, rgb(232, 48, 94) 50%, rgb(223, 32, 96) 100%)"}}>
                <p className="leading-[36px]">시크릿데이</p>
              </div>
            </div>
            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
              <div className="flex flex-col font-['Segoe_UI_Emoji',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#f5f0f1] text-[24px] text-nowrap">
                <p className="leading-[32px]">💋</p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Nav">
            <div className="bg-[rgba(41,25,30,0.5)] content-stretch flex flex-col items-center justify-center px-[20.8px] py-[10.8px] relative rounded-[9999px] shrink-0" data-name="Button">
              <div aria-hidden="true" className="absolute border border-[rgba(55,37,43,0.5)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
              <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(245,240,241,0.8)] text-center text-nowrap">
                <p className="leading-[20px]">메인</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#e9638f] relative rounded-[9999px] shrink-0 to-[#db57af]" data-name="Link">
              <div className="content-stretch flex flex-col items-start overflow-clip px-[20.8px] py-[10.8px] relative rounded-[inherit]">
                <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
                  <p className="leading-[20px]">실시간매칭</p>
                </div>
              </div>
              <div aria-hidden="true" className="absolute border border-[rgba(233,99,143,0.5)] border-solid inset-0 pointer-events-none rounded-[9999px] shadow-[0px_10px_15px_-3px_rgba(233,99,143,0.25),0px_4px_6px_-4px_rgba(233,99,143,0.25)]" />
            </div>
            <SvgLinkBackgroundImageAndText text="VIP영상관" />
            <SvgLinkBackgroundImageAndText text="미니게임" />
            <div className="bg-[rgba(41,25,30,0.5)] content-stretch flex flex-col items-start px-[20.8px] py-[10.8px] relative rounded-[9999px] shrink-0" data-name="Link">
              <div aria-hidden="true" className="absolute border border-[rgba(55,37,43,0.5)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
              <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[13.3px] text-[rgba(245,240,241,0.8)] text-nowrap">
                <p className="leading-[20px]">숙소·코스 예약</p>
              </div>
            </div>
            <SvgLinkBackgroundImageAndText text="포인트" />
            <SvgLinkBackgroundImageAndText text="마이페이지" />
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
            <div className="content-stretch flex gap-[8px] items-center justify-center min-h-[32px] pb-[8px] pt-[7.6px] px-[12.8px] relative rounded-[6px] shrink-0" data-name="Button">
              <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[6px]" />
              <div className="h-[16px] relative shrink-0 w-[20px]" data-name="SVG:margin">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pl-0 pr-[4px] py-0 relative size-full">
                  <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative shrink-0 size-[16px]" data-name="SVG">
                    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[16px]" data-name="Frame">
                      <div className="absolute inset-[12.5%_12.5%_12.5%_62.5%]" data-name="Vector">
                        <div className="absolute inset-[-5.56%_-16.67%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 14">
                            <path d={svgPaths.p30202380} id="Vector" stroke="var(--stroke-0, #F5F0F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-[29.17%_37.5%_29.17%_41.67%]" data-name="Vector">
                        <div className="absolute inset-[-10%_-20%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 8">
                            <path d={svgPaths.p1e2f6dbe} id="Vector" stroke="var(--stroke-0, #F5F0F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-1/2 left-[12.5%] right-[37.5%] top-1/2" data-name="Vector">
                        <div className="absolute inset-[-0.67px_-8.33%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 2">
                            <path d="M8.66667 0.666667H0.666667" id="Vector" stroke="var(--stroke-0, #F5F0F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#f5f0f1] text-[12px] text-center text-nowrap">
                <p className="leading-[16px]">로그인</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative">
        <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#e9638f] text-[14px] text-center text-nowrap">
          <p className="leading-[20px]">실시간 매칭 중</p>
        </div>
      </div>
    </div>
  );
}

function OverlayBorder() {
  return (
    <div className="absolute bg-[rgba(233,99,143,0.1)] content-stretch flex gap-[8px] items-center left-[528.83px] px-[16.8px] py-[8.8px] rounded-[9999px] top-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(233,99,143,0.2)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <SvgBackgroundImage>
        <path d={svgPaths.p874e300} id="Vector" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        <path d="M13.3333 2V4.66667" id="Vector_2" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        <path d="M14.6667 3.33333H12" id="Vector_3" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        <path d="M2.66667 11.3333V12.6667" id="Vector_4" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        <path d="M3.33333 12H2" id="Vector_5" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      </SvgBackgroundImage>
      <Container />
      <div className="bg-[#22c55e] relative rounded-[9999px] shrink-0 size-[8px]" data-name="Background">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid size-full" />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-0 px-[8px] py-0 right-0 top-[61.6px]" data-name="Heading 1">
      <div className="bg-clip-text bg-gradient-to-r flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold from-[#e9638f] justify-center leading-[0] relative shrink-0 text-[36px] text-center text-nowrap to-[#db57af] via-50% via-[#f472b6]" style={{ WebkitTextFillColor: "transparent" }}>
        <p className="leading-[40px]">
          프라이빗 채팅<span className="text-[#f5f0f1]">으로 만남을 시작하세요</span>
        </p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[224px] max-w-[768px] px-[8px] py-0 right-[224px] top-[117.6px]" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[28px] relative shrink-0 text-[#a88a94] text-[18px] text-center text-nowrap">
        <p className="mb-0">
          <span>{`지금 연결된 여성분들과 `}</span>
          <span className="font-['Noto_Sans_KR',sans-serif] font-bold text-[#e9638f]">실시간 프라이빗 채팅</span>을 통해 대화를 나눠보세요.
        </p>
        <p>마음에 드는 분이 있다면 바로 예약까지 이어지도록 준비되어 있습니다.</p>
      </div>
    </div>
  );
}

function Svg1() {
  return (
    <SvgBackgroundImage>
      <path d={svgPaths.p32887f80} id="Vector" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p3694d280} id="Vector_2" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p1f197700} id="Vector_3" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p3bf3e100} id="Vector_4" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
    </SvgBackgroundImage>
  );
}

function Container2() {
  return (
    <ContainerBackgroundImage>
      <span>{`현재 접속: `}</span>
      <span className="font-['Inter',sans-serif] font-bold not-italic text-[#f5f0f1]">426</span>명
    </ContainerBackgroundImage>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <Svg1 />
      <Container2 />
    </div>
  );
}

function Svg2() {
  return (
    <SvgBackgroundImage>
      <path d={svgPaths.p39ee6532} id="Vector" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d="M8 4V8L10.6667 9.33333" id="Vector_2" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
    </SvgBackgroundImage>
  );
}

function Container4() {
  return (
    <ContainerBackgroundImage>
      <span>{`오늘 매칭: `}</span>
      <span className="font-['Inter',sans-serif] font-bold not-italic text-[#f5f0f1]">427</span>건
    </ContainerBackgroundImage>
  );
}

function Container5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <Svg2 />
      <Container4 />
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-center flex flex-wrap gap-[0px_24.01px] items-center justify-center left-0 right-0 top-[197.6px]" data-name="Container">
      <Container3 />
      <Container5 />
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[217.6px] relative shrink-0 w-full" data-name="Container">
      <OverlayBorder />
      <Heading />
      <Container1 />
      <Container6 />
    </div>
  );
}

function Svg3() {
  return (
    <div className="absolute left-1/2 size-[64px] top-[32px] translate-x-[-50%]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64 64">
        <g id="SVG">
          <path d={svgPaths.p27e51b22} id="Vector" stroke="var(--stroke-0, #E9638F)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" strokeWidth="5.33333" />
        </g>
      </svg>
    </div>
  );
}

function Heading1() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[32px] right-[32px] top-[112px]" data-name="Heading 2">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#f5f0f1] text-[20px] text-center text-nowrap">
        <p className="leading-[28px]">로그인이 필요합니다</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[32px] right-[32px] top-[148px]" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#a88a94] text-[16px] text-center text-nowrap">
        <p className="leading-[24px]">실시간 매칭 서비스를 이용하려면 로그인해주세요</p>
      </div>
    </div>
  );
}

function LinkButton() {
  return (
    <div className="absolute bg-[#e9638f] content-stretch flex items-center justify-center left-[calc(50%+0.3px)] min-h-[36px] px-[159px] py-[8.8px] rounded-[6px] top-[196px] translate-x-[-50%]" data-name="Link → Button">
      <div aria-hidden="true" className="absolute border border-[#ee8bac] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#201317] text-[14px] text-center text-nowrap">
        <p className="leading-[20px]">로그인하기</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="h-[265.6px] relative shrink-0 w-[446.4px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Svg3 />
        <Heading1 />
        <Container8 />
        <LinkButton />
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-[#29191e] content-stretch flex flex-col items-start max-w-[448px] p-px relative rounded-[12px] shrink-0 w-[448px]" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[#3d2930] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
      <Container9 />
    </div>
  );
}

function Main() {
  return (
    <div className="content-stretch flex flex-col gap-[63.8px] items-center max-w-[1280px] px-[32px] py-0 relative shrink-0 w-[1280px]" data-name="Main">
      <Container7 />
      <BackgroundBorderShadow />
    </div>
  );
}

function Svg4() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path d={svgPaths.p1ce57300} fill="url(#paint0_linear_1_219)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_219" x1="4" x2="2771.06" y1="2802.67" y2="430.902">
            <stop stopColor="#F42547" />
            <stop offset="0.4" stopColor="#F0427C" />
            <stop offset="0.7" stopColor="#ED5EA6" />
            <stop offset="1" stopColor="#EC79C6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[2px] pt-0 px-0 relative shrink-0" data-name="Container">
      <div className="bg-clip-text bg-gradient-to-r flex flex-col font-['Gungsuh',sans-serif] from-[#f9a8d4] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-nowrap to-[#f472b6] tracking-[0.5px] via-50% via-[#e9638f]" style={{ WebkitTextFillColor: "transparent" }}>
        <p className="leading-[28px]">
          시크릿
          <span className="bg-clip-text bg-gradient-to-r font-['Gungsuh',sans-serif] from-[#f472b6] not-italic to-[#f9a8d4] via-50% via-[#db57af]" style={{ WebkitTextFillColor: "transparent" }}>
            데이
          </span>
        </p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Svg4 />
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[448px] relative shrink-0 w-[448px]" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[24px] relative shrink-0 text-[#a88a94] text-[16px] text-nowrap">
        <p className="mb-0">특별한 데이트를 위한 숙소와 코스를 한 번에 예약하세요. 잊지 못할</p>
        <p>추억을 만들어 드립니다.</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative self-stretch shrink-0 w-[800px]" data-name="Container">
      <Container11 />
      <Container12 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 4">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#f5f0f1] text-[16px] w-full">
        <p className="leading-[24px]">빠른 링크</p>
      </div>
    </div>
  );
}

function Item() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[1.6px] pt-[2.4px] px-0 relative shrink-0 w-full" data-name="Item">
      <LinkBackgroundImageAndText text="메인" />
    </div>
  );
}

function Item1() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[1.6px] pt-[2.4px] px-0 relative shrink-0 w-full" data-name="Item">
      <LinkBackgroundImageAndText text="숙소 예약" />
    </div>
  );
}

function Item2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[1.6px] pt-[2.4px] px-0 relative shrink-0 w-full" data-name="Item">
      <LinkBackgroundImageAndText text="VIP영상관" />
    </div>
  );
}

function Item3() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[1.6px] pt-[2.4px] px-0 relative shrink-0 w-full" data-name="Item">
      <LinkBackgroundImageAndText text="포인트" />
    </div>
  );
}

function Item4() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[1.6px] pt-[2.4px] px-0 relative shrink-0 w-full" data-name="Item">
      <LinkBackgroundImageAndText text="미니게임" />
    </div>
  );
}

function List() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="List">
      <Item />
      <Item1 />
      <Item2 />
      <Item3 />
      <Item4 />
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative self-stretch shrink-0 w-[384px]" data-name="Container">
      <Heading2 />
      <List />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex gap-[32px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container13 />
      <Container14 />
    </div>
  );
}

function Container16() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative w-full">
        <div className="flex flex-col font-['Inter','Noto_Sans_KR',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a88a94] text-[14px] text-center w-full">
          <p className="leading-[20px]">© 2025 시크릿데이. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="content-stretch flex flex-col items-start pb-0 pt-[32.8px] px-0 relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[#37252b] border-[0.8px_0px_0px] border-solid inset-0 pointer-events-none" />
      <Container16 />
    </div>
  );
}

function Container17() {
  return (
    <div className="max-w-[1280px] relative shrink-0 w-full" data-name="Container">
      <div className="max-w-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[32px] items-start max-w-[inherit] px-[32px] py-0 relative w-full">
          <Container15 />
          <HorizontalBorder />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="bg-[#29191e] relative shrink-0 w-full" data-name="Footer">
      <div aria-hidden="true" className="absolute border-[#37252b] border-[0.8px_0px_0px] border-solid inset-0 pointer-events-none" />
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pb-[48px] pt-[48.8px] px-[320px] relative w-full">
          <Container17 />
        </div>
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#201317] content-stretch flex flex-col gap-[64px] items-center min-h-[1200px] pb-[117.6px] pt-[96px] px-0 relative shrink-0 w-full" data-name="Background">
      <Main />
      <Footer />
    </div>
  );
}

export default function Component1920WDefault() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="1920w default" style={{ backgroundImage: "linear-gradient(90deg, rgb(32, 19, 23) 0%, rgb(32, 19, 23) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <Svg />
      <Background />
    </div>
  );
}
