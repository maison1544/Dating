import svgPaths from "./svg-ppk50t6umu";
import clsx from "clsx";
type BackgroundShadowBackgroundImageProps = {
  additionalClassNames?: string;
};

function BackgroundShadowBackgroundImage({ children, additionalClassNames = "" }: React.PropsWithChildren<BackgroundShadowBackgroundImageProps>) {
  return (
    <div style={{ backgroundImage: "linear-gradient(145deg, rgb(255, 255, 255) 0%, rgb(240, 240, 240) 50%, rgb(232, 232, 232) 100%)" }} className={clsx("rounded-[9px]", additionalClassNames)}>
      {children}
    </div>
  );
}

function BackgroundImage12({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="size-full">
      <div className="content-stretch flex flex-col items-start pb-[12.8px] pt-[12px] px-[12px] relative w-full">{children}</div>
    </div>
  );
}

function ContainerBackgroundImage1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative w-full">{children}</div>
    </div>
  );
}
type ContainerBackgroundImageProps = {
  text: string;
};

function ContainerBackgroundImage({ children, text }: React.PropsWithChildren<ContainerBackgroundImageProps>) {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full">
      <div className="overflow-auto size-full">
        <div className="content-stretch flex flex-col items-start p-[8px] relative size-full">
          <div className="content-stretch flex flex-col items-center px-0 py-[24px] relative shrink-0 w-full">
            <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[14px] text-center w-full">
              <p className="leading-[20px]">{text}</p>
            </div>
          </div>
        </div>
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
type ContainerBackgroundImageAndText1Props = {
  text: string;
};

function ContainerBackgroundImageAndText1({ text }: ContainerBackgroundImageAndText1Props) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#64748b] text-[12px] text-nowrap">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type ButtonBackgroundImageAndText1Props = {
  text: string;
  additionalClassNames?: string;
};

function ButtonBackgroundImageAndText1({ text, additionalClassNames = "" }: ButtonBackgroundImageAndText1Props) {
  return (
    <div className={clsx("bg-gradient-to-b min-h-[36px] opacity-50 relative rounded-[12px] shrink-0", additionalClassNames)}>
      <div className="content-stretch flex items-center justify-center min-h-[inherit] overflow-clip pl-[148.71px] pr-[148.73px] py-[20.8px] relative rounded-[inherit]">
        <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[18px] text-center text-nowrap text-white">
          <p className="leading-[28px]">{text}</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ee8bac] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
    </div>
  );
}
type ButtonBackgroundImageAndTextProps = {
  text: string;
};

function ButtonBackgroundImageAndText({ text }: ButtonBackgroundImageAndTextProps) {
  return (
    <div className="bg-[rgba(30,41,59,0.4)] content-stretch flex items-center justify-center min-h-[32px] pb-[8.4px] pt-[7.6px] px-[12.8px] relative rounded-[6px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#f5f0f1] text-[12px] text-center text-nowrap">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type ContainerBackgroundImageAndTextProps = {
  text: string;
};

function ContainerBackgroundImageAndText({ text }: ContainerBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0">
      <div className="flex flex-col font-['Inter',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#64748b] text-[12px] text-nowrap">
        <p className="leading-[16px]">{text}</p>
      </div>
    </div>
  );
}
type BackgroundImage11Props = {
  additionalClassNames?: string;
};

function BackgroundImage11({ additionalClassNames = "" }: BackgroundImage11Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] w-[1.5px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage10Props = {
  additionalClassNames?: string;
};

function BackgroundImage10({ additionalClassNames = "" }: BackgroundImage10Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] top-[1.87px] w-[14.02px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage9Props = {
  additionalClassNames?: string;
};

function BackgroundImage9({ additionalClassNames = "" }: BackgroundImage9Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] h-[13.06px] rounded-[9999px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage8Props = {
  additionalClassNames?: string;
};

function BackgroundImage8({ additionalClassNames = "" }: BackgroundImage8Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] left-[1.22px] rounded-[9999px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage7Props = {
  additionalClassNames?: string;
};

function BackgroundImage7({ additionalClassNames = "" }: BackgroundImage7Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] h-[14.03px] rounded-[9999px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage6Props = {
  additionalClassNames?: string;
};

function BackgroundImage6({ additionalClassNames = "" }: BackgroundImage6Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] w-[1.71px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage5Props = {
  additionalClassNames?: string;
};

function BackgroundImage5({ additionalClassNames = "" }: BackgroundImage5Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] h-[13.44px] rounded-[9999px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage4Props = {
  additionalClassNames?: string;
};

function BackgroundImage4({ additionalClassNames = "" }: BackgroundImage4Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] w-[13.06px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage3Props = {
  additionalClassNames?: string;
};

function BackgroundImage3({ additionalClassNames = "" }: BackgroundImage3Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] w-[14.03px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage2Props = {
  additionalClassNames?: string;
};

function BackgroundImage2({ additionalClassNames = "" }: BackgroundImage2Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] size-[14.63px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImage1Props = {
  additionalClassNames?: string;
};

function BackgroundImage1({ additionalClassNames = "" }: BackgroundImage1Props) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] w-[12.22px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}
type BackgroundImageProps = {
  additionalClassNames?: string;
};

function BackgroundImage({ additionalClassNames = "" }: BackgroundImageProps) {
  return (
    <div className={clsx("absolute bg-[#1f2937] rounded-[9999px] size-[11.38px]", additionalClassNames)}>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Svg() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="SVG">
          <path d={svgPaths.p4a2ac80} id="Vector" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d={svgPaths.p30e15d00} id="Vector_2" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M7 21H7.01167" id="Vector_3" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M11.6667 16.3333H11.6783" id="Vector_4" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M17.5 7H17.5117" id="Vector_5" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
          <path d="M21 10.5H21.0117" id="Vector_6" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.33333" />
        </g>
      </svg>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#f472b6] text-[30px] text-nowrap">
        <p className="leading-[36px]">주사위게임 3분</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0 w-full" data-name="Container">
      <Svg />
      <Heading />
      <Svg />
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#fbcfe8] text-[12px] text-center w-full">
        <p className="leading-[16px]">
          <span>{`시크릿데이 주사위게임 기준으로 `}</span>
          <span className="font-['Noto_Sans_KR',sans-serif] font-bold text-[#67e8f9]">3분 단위로 추첨</span>
        </p>
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-gradient-to-r from-[rgba(219,39,119,0.4)] relative rounded-tl-[16px] rounded-tr-[16px] shrink-0 to-[rgba(219,39,119,0.4)] via-50% via-[rgba(236,72,153,0.6)] w-full" data-name="Background">
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start p-[4px] relative w-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function OverlayBorder() {
  return (
    <div className="bg-[rgba(30,41,59,0.8)] content-stretch flex items-start justify-center pb-[8.4px] pt-[9.2px] px-[16.8px] relative rounded-[9999px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(71,85,105,0.5)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-col font-['GulimChe',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#cbd5e1] text-[14px] text-center text-nowrap">
        <p className="leading-[20px]">2025.12.13 10:31:40</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <OverlayBorder />
    </div>
  );
}

function Gradient() {
  return (
    <div className="absolute inset-[1.6px] opacity-20 rounded-[12px]" data-name="Gradient" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 636.8 260\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'1\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(78.8 0 0 32.173 -23562 -9620)\\\'><stop stop-color=\\\'rgba(100,150,200,0.3)\\\' offset=\\\'0.025254\\\'/><stop stop-color=\\\'rgba(100,150,200,0)\\\' offset=\\\'0.025254\\\'/></radialGradient></defs></svg>')" }}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid size-full" />
    </div>
  );
}

function BackgroundShadow() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="relative size-full">
      <BackgroundImage additionalClassNames="left-[10.67px] top-[10.67px]" />
      <BackgroundImage additionalClassNames="right-[10.66px] top-[10.67px]" />
      <BackgroundImage additionalClassNames="left-[10.67px] top-[29.87px]" />
      <BackgroundImage additionalClassNames="right-[10.66px] top-[29.87px]" />
      <BackgroundImage additionalClassNames="bottom-[10.66px] left-[10.67px]" />
      <BackgroundImage additionalClassNames="bottom-[10.66px] right-[10.66px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow1() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[5.55%_5.56%_76.49%_5.55%]">
      <div className="absolute bg-[#1f2937] h-[1.5px] right-[9.8px] rounded-[9999px] top-[-1.22px] w-[11.77px]" data-name="Horizontal Divider">
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
      </div>
      <div className="absolute bg-[#1f2937] bottom-[18.55px] h-[2.25px] left-[6.16px] rounded-[9999px] w-[13.44px]" data-name="Background+Shadow">
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow2() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[-7.14%_-25.1%_-7.15%_107.14%]">
      <BackgroundImage6 additionalClassNames="h-[12.22px] right-[20.18px] top-[18.98px]" />
      <BackgroundImage9 additionalClassNames="left-[-4.89px] top-[39.18px] w-[1.62px]" />
      <BackgroundImage7 additionalClassNames="bottom-[15.03px] left-[-1.87px] w-[1.97px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow3() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[5.55%_76.49%_5.56%_5.55%]">
      <BackgroundImage6 additionalClassNames="h-[11.77px] left-[-1.22px] top-[9.81px]" />
      <BackgroundImage5 additionalClassNames="right-[18.55px] top-[6.16px] w-[2.25px]" />
      <BackgroundImage11 additionalClassNames="bottom-[9.8px] h-[11.77px] left-[-1.22px]" />
      <BackgroundImage5 additionalClassNames="bottom-[6.15px] right-[18.83px] w-[1.97px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow4() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[107.14%_-7.15%_-25.1%_-7.14%]">
      <BackgroundImage3 additionalClassNames="h-[2.25px] left-[15.03px] top-[-1.87px]" />
      <BackgroundImage3 additionalClassNames="h-[1.97px] right-[15.03px] top-[-1.87px]" />
      <BackgroundImage4 additionalClassNames="h-[1.62px] left-[39.18px] top-[-4.89px]" />
      <BackgroundImage1 additionalClassNames="bottom-[20.18px] h-[1.71px] left-[18.98px]" />
      <BackgroundImage1 additionalClassNames="bottom-[20.39px] h-[1.5px] right-[18.99px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow5() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[-7.14%_-7.15%_-7.15%_-7.14%]">
      <div className="absolute bg-[#1f2937] left-[38.4px] rounded-[9999px] size-[14.62px] top-[38.4px]" data-name="Background+Shadow">
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function Container3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="Container">
      <div className="absolute flex inset-[5.55%_5.55%_5.56%_5.56%] items-center justify-center">
        <div className="flex-none rotate-[180deg] scale-y-[-100%] size-[71.11px]">
          <BackgroundShadow />
        </div>
      </div>
      <BackgroundShadow1 />
      <BackgroundShadow2 />
      <BackgroundShadow3 />
      <BackgroundShadow4 />
      <BackgroundShadow5 />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[80px]" data-name="Container">
      <Container3 />
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[calc(50%-120px)] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Container">
      <Container4 />
    </div>
  );
}

function BackgroundShadow6() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="relative size-full">
      <BackgroundImage10 additionalClassNames="h-[2.25px] left-[15.03px]" />
      <BackgroundImage10 additionalClassNames="h-[1.978px] right-[15.04px]" />
      <BackgroundImage4 additionalClassNames="h-[1.953px] left-[17.14px] top-[4.89px]" />
      <BackgroundImage4 additionalClassNames="h-[1.712px] right-[17.15px] top-[4.89px]" />
      <BackgroundImage1 additionalClassNames="bottom-[5.13px] h-[1.717px] left-[18.98px]" />
      <BackgroundImage1 additionalClassNames="bottom-[5.34px] h-[1.506px] right-[18.99px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow7() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[-449.9%_0_-350%_0]">
      <BackgroundImage2 additionalClassNames="right-[13.72px] top-[13.71px]" />
      <BackgroundImage2 additionalClassNames="bottom-[13.72px] left-[13.71px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow8() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[449.9%_-99.99%_-491.34%_99.99%]">
      <BackgroundImage3 additionalClassNames="h-[1.97px] right-[79.27px] top-[-62.37px]" />
      <BackgroundImage4 additionalClassNames="h-[1.62px] left-[-4.89px] top-[-39.18px]" />
      <BackgroundImage1 additionalClassNames="bottom-[31.64px] h-[1.71px] left-[-7.52px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow9() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[-449.9%_0_408.46%_0]">
      <BackgroundImage3 additionalClassNames="h-[2.25px] left-[1.87px] top-[15.03px]" />
      <BackgroundImage3 additionalClassNames="h-[1.97px] right-[75.53px] top-[62.37px]" />
      <BackgroundImage1 additionalClassNames="bottom-[-6.32px] h-[1.71px] left-[7.52px]" />
      <BackgroundImage1 additionalClassNames="bottom-[-47.35px] h-[1.5px] right-[71.69px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow10() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[350%_11.12%_-949.9%_11.1%]">
      <BackgroundImage additionalClassNames="left-[10.67px] top-[-10.67px]" />
      <BackgroundImage additionalClassNames="right-[10.66px] top-[-10.67px]" />
      <BackgroundImage additionalClassNames="left-[29.87px] top-[-29.87px]" />
      <BackgroundImage additionalClassNames="bottom-[108.8px] left-[10.67px]" />
      <BackgroundImage additionalClassNames="bottom-[108.8px] right-[10.66px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow11() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[449.9%_0_-491.34%_0]">
      <BackgroundImage4 additionalClassNames="h-[1.621px] left-[39.18px] top-[-4.89px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function Container6() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[91.43px]" data-name="Container">
      <div className="absolute flex inset-[-449.9%_0.01%_408.46%_-0.01%] items-center justify-center">
        <div className="flex-none h-[14.37px] rotate-[180deg] scale-y-[-100%] w-[91.43px]">
          <BackgroundShadow6 />
        </div>
      </div>
      <BackgroundShadow7 />
      <BackgroundShadow8 />
      <BackgroundShadow9 />
      <BackgroundShadow10 />
      <BackgroundShadow11 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex flex-col h-[80px] items-start justify-center pb-[29.84px] pt-[40px] px-0 relative shrink-0 w-[85.71px]" data-name="Container">
      <Container6 />
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[calc(50%-2.85px)] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Container">
      <Container7 />
    </div>
  );
}

function BackgroundShadow12() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="relative size-full">
      <BackgroundImage8 additionalClassNames="h-[11.77px] top-[9.81px] w-[1.717px]" />
      <BackgroundImage5 additionalClassNames="right-[5.69px] top-[6.16px] w-[2.25px]" />
      <BackgroundImage8 additionalClassNames="h-[11.78px] top-[29.67px] w-[1.427px]" />
      <BackgroundImage5 additionalClassNames="right-[6.07px] top-[28.84px] w-[1.873px]" />
      <BackgroundImage8 additionalClassNames="bottom-[9.8px] h-[11.77px] w-[1.506px]" />
      <BackgroundImage5 additionalClassNames="bottom-[6.15px] right-[5.96px] w-[1.978px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow13() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[0_408.46%_0_-449.9%]">
      <BackgroundImage6 additionalClassNames="h-[12.22px] right-[-6.32px] top-[7.52px]" />
      <BackgroundImage7 additionalClassNames="bottom-[75.53px] left-[62.37px] w-[1.97px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow14() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[11.1%_-949.9%_11.12%_350%]">
      <BackgroundImage additionalClassNames="right-[108.8px] top-[10.67px]" />
      <BackgroundImage additionalClassNames="left-[-29.87px] top-[29.87px]" />
      <BackgroundImage additionalClassNames="bottom-[10.66px] left-[-10.67px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow15() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[0_-350%_0_-449.9%]">
      <BackgroundImage2 additionalClassNames="left-[13.71px] top-[13.71px]" />
      <BackgroundImage2 additionalClassNames="right-[13.72px] top-[13.71px]" />
      <BackgroundImage2 additionalClassNames="bottom-[13.72px] left-[13.71px]" />
      <BackgroundImage2 additionalClassNames="bottom-[13.72px] right-[13.72px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow16() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[99.99%_-491.34%_-99.99%_449.9%]">
      <BackgroundImage7 additionalClassNames="left-[-15.03px] top-[-1.87px] w-[2.25px]" />
      <BackgroundImage6 additionalClassNames="h-[12.22px] right-[31.64px] top-[-7.52px]" />
      <BackgroundImage9 additionalClassNames="left-[-39.18px] top-[-4.89px] w-[1.62px]" />
      <BackgroundImage7 additionalClassNames="bottom-[79.27px] left-[-62.37px] w-[1.97px]" />
      <BackgroundImage11 additionalClassNames="bottom-[86.73px] h-[12.22px] right-[73.09px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function BackgroundShadow17() {
  return (
    <BackgroundShadowBackgroundImage additionalClassNames="absolute inset-[0_-491.34%_0_449.9%]">
      <BackgroundImage9 additionalClassNames="left-[-4.89px] top-[39.18px] w-[1.621px]" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(255,255,255,0.8),inset_0px_-2px_4px_0px_rgba(0,0,0,0.1)]" />
    </BackgroundShadowBackgroundImage>
  );
}

function Container9() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full" data-name="Container">
      <div className="absolute flex inset-[11.1%_450%_11.12%_-491.44%] items-center justify-center">
        <div className="flex-none h-[71.11px] rotate-[180deg] scale-y-[-100%] w-[14.37px]">
          <BackgroundShadow12 />
        </div>
      </div>
      <BackgroundShadow13 />
      <BackgroundShadow14 />
      <BackgroundShadow15 />
      <BackgroundShadow16 />
      <BackgroundShadow17 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col h-[91.43px] items-start justify-center pl-[40px] pr-[29.84px] py-0 relative shrink-0 w-[80px]" data-name="Container">
      <Container9 />
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute content-stretch flex flex-col items-center left-[calc(50%+120px)] top-[calc(50%+0.01px)] translate-x-[-50%] translate-y-[-50%]" data-name="Container">
      <Container10 />
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[80px] opacity-40 relative shrink-0 w-full" data-name="Container">
      <Container5 />
      <Container8 />
      <Container11 />
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[14px] text-center text-nowrap">
        <p className="leading-[20px]">배팅 후 다음 추첨을 기다리세요</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start min-w-[320px] relative shrink-0" data-name="Container">
      <Container12 />
      <Container13 />
    </div>
  );
}

function Container15() {
  return (
    <div className="min-h-[260px] relative shrink-0 w-[636.8px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center min-h-[inherit] px-[48px] py-[72px] relative w-full">
        <Container14 />
      </div>
    </div>
  );
}

function BackgroundBorderShadow() {
  return (
    <div className="bg-gradient-to-b from-[#0c1929] relative rounded-[12px] shrink-0 to-[#0c1929] via-50% via-[#162a45] w-full" data-name="Background+Border+Shadow">
      <div aria-hidden="true" className="absolute border border-[#1e4a6e] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start p-[1.6px] relative w-full">
          <Gradient />
          <Container15 />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_30px_1px_rgba(0,0,0,0.5)]" />
    </div>
  );
}

function BackgroundShadow18() {
  return (
    <div className="bg-gradient-to-r content-stretch flex flex-col from-[#db2777] items-start overflow-clip px-[16px] py-[6px] relative rounded-[9999px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] shrink-0 to-[#ec4899]" data-name="Background+Shadow">
      <div className="flex flex-col font-['Inter','Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-nowrap text-white">
        <p className="leading-[28px]">
          211<span className="font-['Inter','Noto_Sans_KR',sans-serif] font-normal not-italic text-[#fbcfe8]">/480</span>회차
        </p>
      </div>
    </div>
  );
}

function OverlayBorder1() {
  return (
    <div className="bg-[rgba(34,197,94,0.2)] content-stretch flex flex-col items-start px-[12.8px] py-[4.8px] relative rounded-[9999px] shrink-0" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(34,197,94,0.4)] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#4ade80] text-[14px] text-nowrap">
        <p className="leading-[20px]">배팅 중</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="relative shrink-0 w-[606.4px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[7.99px] items-center justify-center relative w-full">
        <BackgroundShadow18 />
        <OverlayBorder1 />
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['GulimChe',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#22d3ee] text-[60px] text-nowrap tracking-[3px]">
        <p className="leading-[60px]">01:20</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="relative shrink-0 w-[606.4px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative w-full">
        <Container17 />
      </div>
    </div>
  );
}

function OverlayShadow() {
  return (
    <div className="bg-[rgba(51,65,85,0.8)] h-[12px] overflow-clip relative rounded-[9999px] shrink-0 w-full" data-name="Overlay+Shadow">
      <div className="absolute bg-gradient-to-r from-[#0891b2] inset-[0_55.56%_0_0] rounded-[9999px] to-[#22d3ee] via-50% via-[#06b6d4]" data-name="Gradient" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[12px] text-nowrap">
        <p className="leading-[16px]">212회차 추첨까지</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Container">
      <ContainerBackgroundImageAndText text="0:00" />
      <Container19 />
      <ContainerBackgroundImageAndText text="3:00" />
    </div>
  );
}

function Container21() {
  return (
    <div className="relative shrink-0 w-[606.4px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[6px] items-start relative w-full">
        <OverlayShadow />
        <Container20 />
      </div>
    </div>
  );
}

function BackgroundBorderShadow1() {
  return (
    <div className="bg-gradient-to-r from-[rgba(30,41,59,0.8)] relative rounded-[16px] shrink-0 to-[rgba(30,41,59,0.8)] via-50% via-[rgba(15,23,42,0.9)] w-full" data-name="Background+Border+Shadow">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col gap-[12px] items-start p-[16.8px] relative w-full">
          <Container16 />
          <Container18 />
          <Container21 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(236,72,153,0.3)] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_10px_15px_-3px_rgba(236,72,153,0.1),0px_4px_6px_-4px_rgba(236,72,153,0.1)]" />
    </div>
  );
}

function Svg1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d={svgPaths.p1e57e600} id="Vector" stroke="var(--stroke-0, #FACC15)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p2a7ce900} id="Vector_2" stroke="var(--stroke-0, #FACC15)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d="M5.83333 5H6.66667V8.33333" id="Vector_3" stroke="var(--stroke-0, #FACC15)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          <path d={svgPaths.p25bee380} id="Vector_4" stroke="var(--stroke-0, #FACC15)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#fde047] text-[14px] text-nowrap">
        <p className="leading-[20px]">내 잔액</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative">
        <Svg1 />
        <Container22 />
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative">
        <div className="flex flex-col font-['Inter',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#facc15] text-[18px] text-nowrap">
          <p className="leading-[28px]">0P</p>
        </div>
      </div>
    </div>
  );
}

function OverlayBorder2() {
  return (
    <div className="bg-[rgba(234,179,8,0.1)] relative rounded-[9px] shrink-0 w-full" data-name="Overlay+Border">
      <div aria-hidden="true" className="absolute border border-[rgba(234,179,8,0.3)] border-solid inset-0 pointer-events-none rounded-[9px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[12.8px] relative w-full">
          <Container23 />
          <Container24 />
        </div>
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Label">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[12px] w-full">
        <p className="leading-[16px]">배팅 금액 (최소 5,000P)</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute bottom-[8.8px] content-stretch flex flex-col items-center left-[12.8px] overflow-clip pb-[0.8px] pt-[2.4px] px-[260.53px] top-[7.2px]" data-name="Container">
      <div className="flex flex-col font-['Inter','Noto_Sans_KR',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#a88a94] text-[14px] text-center text-nowrap">
        <p className="leading-[normal]">5,000P 이상</p>
      </div>
    </div>
  );
}

function Container26() {
  return <div className="basis-0 grow h-[16.8px] min-h-px min-w-px shrink-0" data-name="Container" />;
}

function Container27() {
  return (
    <div className="absolute bottom-[9.6px] content-stretch flex items-center left-[12.8px] top-[9.6px]" data-name="Container">
      <Container26 />
      <div className="h-full min-w-[15px] opacity-0 shrink-0 w-[15px]" data-name="Rectangle" />
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[rgba(30,41,59,0.6)] h-[36px] relative rounded-[6px] shrink-0 w-full" data-name="Input">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Container25 />
        <Container27 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#475569] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[rgba(30,41,59,0.4)] content-stretch flex items-center justify-center min-h-[32px] pb-[8.4px] pt-[7.6px] px-[12.8px] relative rounded-[6px] shrink-0" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="flex flex-col font-['Inter','Noto_Sans_KR',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#f5f0f1] text-[12px] text-center text-nowrap">
        <p className="leading-[16px]">10만</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="content-start flex flex-wrap gap-[0px_8px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <ButtonBackgroundImageAndText text="5천" />
      <ButtonBackgroundImageAndText text="1만" />
      <ButtonBackgroundImageAndText text="5만" />
      <Button />
      <ButtonBackgroundImageAndText text="전액" />
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Label />
      <Input />
      <Container28 />
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[0] relative shrink-0 text-[#94a3b8] text-[12px] text-center w-full">
        <p className="leading-[16px]">홀/짝 (합계 기준) - 최대 2개 선택 가능</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <ButtonBackgroundImageAndText1 text="홀" additionalClassNames="from-[#ef4444] to-[#dc2626]" />
      <ButtonBackgroundImageAndText1 text="짝" additionalClassNames="from-[#3b82f6] to-[#2563eb]" />
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container30 />
      <Container31 />
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter','Noto_Sans_KR',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#94a3b8] text-[12px] text-center w-full">
        <p className="leading-[16px]">소/대 (합계: 소 3~9, 대 10~18)</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <ButtonBackgroundImageAndText1 text="소" additionalClassNames="from-[#a855f7] to-[#9333ea]" />
      <ButtonBackgroundImageAndText1 text="대" additionalClassNames="from-[#f97316] to-[#ea580c]" />
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Container">
      <Container33 />
      <Container34 />
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Container">
      <OverlayBorder2 />
      <Container29 />
      <Container32 />
      <Container35 />
    </div>
  );
}

function Container37() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[16px] items-start p-[24px] relative w-full">
          <Container2 />
          <BackgroundBorderShadow />
          <BackgroundBorderShadow1 />
          <Container36 />
        </div>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-gradient-to-b content-stretch flex flex-col from-[#2d1f3d] items-start relative rounded-[16px] self-stretch shrink-0 to-[#1e1428] w-[688px]" data-name="Background">
      <Background />
      <Container37 />
    </div>
  );
}

function Svg2() {
  return (
    <SvgBackgroundImage>
      <path d={svgPaths.p1c437700} id="Vector" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p25d12700} id="Vector_2" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d="M4 12H4.00667" id="Vector_3" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d="M6.66667 9.33333H6.67333" id="Vector_4" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d="M10 4H10.0067" id="Vector_5" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d="M12 6H12.0067" id="Vector_6" stroke="var(--stroke-0, #F472B6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
    </SvgBackgroundImage>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#fbcfe8] text-[14px] text-nowrap">
        <p className="leading-[20px]">최근 결과</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <Svg2 />
      <Container38 />
    </div>
  );
}

function Container40() {
  return (
    <ContainerBackgroundImage1>
      <Container39 />
      <ContainerBackgroundImageAndText1 text="회차" />
    </ContainerBackgroundImage1>
  );
}

function BackgroundHorizontalBorder() {
  return (
    <div className="bg-gradient-to-r from-[rgba(219,39,119,0.4)] relative shrink-0 to-[rgba(190,24,93,0.3)] w-full" data-name="Background+HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.8px] border-[rgba(236,72,153,0.3)] border-solid inset-0 pointer-events-none" />
      <BackgroundImage12>
        <Container40 />
      </BackgroundImage12>
    </div>
  );
}

function Background2() {
  return (
    <div className="basis-0 bg-gradient-to-b content-stretch flex flex-col from-[#2d1f3d] grow items-start min-h-px min-w-px overflow-clip relative rounded-[16px] shrink-0 to-[#1e1428] w-full" data-name="Background">
      <BackgroundHorizontalBorder />
      <ContainerBackgroundImage text="아직 결과가 없습니다" />
    </div>
  );
}

function Svg3() {
  return (
    <SvgBackgroundImage>
      <path d={svgPaths.p30052a00} id="Vector" stroke="var(--stroke-0, #22D3EE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p1b84be20} id="Vector_2" stroke="var(--stroke-0, #22D3EE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d="M2.66667 14.6667H13.3333" id="Vector_3" stroke="var(--stroke-0, #22D3EE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p3205b80} id="Vector_4" stroke="var(--stroke-0, #22D3EE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p3222c80} id="Vector_5" stroke="var(--stroke-0, #22D3EE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
      <path d={svgPaths.p2274e770} id="Vector_6" stroke="var(--stroke-0, #22D3EE)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
    </SvgBackgroundImage>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#a5f3fc] text-[14px] text-nowrap">
        <p className="leading-[20px]">내 배팅 기록</p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Container">
      <Svg3 />
      <Container41 />
    </div>
  );
}

function Container43() {
  return (
    <ContainerBackgroundImage1>
      <Container42 />
      <ContainerBackgroundImageAndText1 text="결과" />
    </ContainerBackgroundImage1>
  );
}

function BackgroundHorizontalBorder1() {
  return (
    <div className="bg-gradient-to-r from-[rgba(8,145,178,0.4)] relative shrink-0 to-[rgba(14,116,144,0.3)] w-full" data-name="Background+HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[0px_0px_0.8px] border-[rgba(6,182,212,0.3)] border-solid inset-0 pointer-events-none" />
      <BackgroundImage12>
        <Container43 />
      </BackgroundImage12>
    </div>
  );
}

function Background3() {
  return (
    <div className="basis-0 bg-gradient-to-b content-stretch flex flex-col from-[#1f2d3d] grow items-start min-h-px min-w-px overflow-clip relative rounded-[16px] shrink-0 to-[#141e28] w-full" data-name="Background">
      <BackgroundHorizontalBorder1 />
      <ContainerBackgroundImage text="배팅 기록이 없습니다" />
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start justify-center relative self-stretch shrink-0 w-[320px]" data-name="Container">
      <Background2 />
      <Background3 />
    </div>
  );
}

function Container45() {
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-center max-w-[1024px] relative shrink-0 w-[1024px]" data-name="Container">
      <Background1 />
      <Container44 />
    </div>
  );
}

function MainSection() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center max-w-[1280px] px-[32px] py-0 relative shrink-0 w-[1280px]" data-name="Main → Section">
      <Container />
      <Container45 />
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

function Container46() {
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

function Container47() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Svg4 />
      <Container46 />
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[448px] relative shrink-0 w-[448px]" data-name="Container">
      <div className="flex flex-col font-['Noto_Sans_KR',sans-serif] font-[350] justify-center leading-[24px] relative shrink-0 text-[#a88a94] text-[16px] text-nowrap">
        <p className="mb-0">특별한 데이트를 위한 숙소와 코스를 한 번에 예약하세요. 잊지 못할</p>
        <p>추억을 만들어 드립니다.</p>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative self-stretch shrink-0 w-[800px]" data-name="Container">
      <Container47 />
      <Container48 />
    </div>
  );
}

function Heading1() {
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

function Container50() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative self-stretch shrink-0 w-[384px]" data-name="Container">
      <Heading1 />
      <List />
    </div>
  );
}

function Container51() {
  return (
    <div className="content-stretch flex gap-[32px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Container49 />
      <Container50 />
    </div>
  );
}

function Container52() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative w-full">
        <div className="flex flex-col font-['Inter:Regular','Noto_Sans_KR:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a88a94] text-[14px] text-center w-full">
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
      <Container52 />
    </div>
  );
}

function Container53() {
  return (
    <div className="max-w-[1280px] relative shrink-0 w-full" data-name="Container">
      <div className="max-w-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[32px] items-start max-w-[inherit] px-[32px] py-0 relative w-full">
          <Container51 />
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
          <Container53 />
        </div>
      </div>
    </div>
  );
}

export default function Background4() {
  return (
    <div className="bg-[#201317] content-stretch flex flex-col gap-[48px] items-center pb-0 pt-[128px] px-0 relative size-full" data-name="Background">
      <MainSection />
      <Footer />
    </div>
  );
}