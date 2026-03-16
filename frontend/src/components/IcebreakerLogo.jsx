export function IcebreakerLogo({ size = "md", onClick }) {
  const sizes = {
    sm: { box: "w-7 h-7", rounded: "rounded-lg", svg: 14, cx: 7, r: 2.5, path: "M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13", sw: 1.4 },
    md: { box: "w-8 h-8", rounded: "rounded-lg", svg: 16, cx: 8, r: 3, path: "M8 1v2M8 13v2M1 8h2M13 8h2", sw: 1.5 },
    lg: { box: "w-9 h-9", rounded: "rounded-xl", svg: 18, cx: 9, r: 3.5, path: "M9 1v2.5M9 14.5V17M1 9h2.5M14.5 9H17", sw: 1.8 },
  };
  const s = sizes[size];
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`flex items-center gap-2.5 ${onClick ? "hover:opacity-80 transition-opacity" : ""}`}
    >
      <div className={`${s.box} ${s.rounded} bg-gradient-to-br from-[#EAB308] to-[#854D0E] flex items-center justify-center shrink-0`}>
        <svg width={s.svg} height={s.svg} viewBox={`0 0 ${s.svg} ${s.svg}`} fill="none">
          <circle cx={s.cx} cy={s.cx} r={s.r} fill="white" />
          <path d={s.path} stroke="white" strokeWidth={s.sw} strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#EAB308]">
        Icebreaker
      </span>
    </Wrapper>
  );
}
