export default function Logo() {
  return (
    <div
      className="content-stretch flex flex-col gap-0 items-center justify-center relative w-full h-full"
      data-name="Logo"
    >
      <div className="flex items-baseline gap-1">
        <span className="text-white font-bold text-xl tracking-wider">SOLUTION</span>
        <span className="text-pink-500 font-bold text-xl tracking-wider">STUDIO</span>
      </div>
      <div className="text-gray-400 text-[10px] tracking-[0.2em] uppercase -mt-1">
        PREMIUM SOLUTION
      </div>
    </div>
  );
}