import type { CourseCategory } from "@/types/course";

// Flat geometric artwork in the logo's palette, one motif per category, until real
// classroom and lab photography exists (PROJECT_GUIDE §13).
const NAVY = "#284078";
const DEEP = "#1b2c55";
const BLUE = "#285098";
const SKY = "#3d73c4";
const ORANGE = "#f08030";
const PALE = "#e1f0fb";

function Motif({ category }: { category: CourseCategory }) {
  switch (category) {
    case "Design": // layered frames, as in Photoshop and DTP
      return (
        <>
          <rect x="70" y="40" width="150" height="100" rx="10" fill={DEEP} />
          <rect x="100" y="62" width="150" height="100" rx="10" fill={BLUE} />
          <rect x="130" y="84" width="120" height="78" rx="10" fill={ORANGE} />
          <circle cx="160" cy="112" r="14" fill={PALE} />
        </>
      );
    case "Accounting": // a ledger and bars, for Tally
      return (
        <>
          <rect x="60" y="36" width="120" height="132" rx="10" fill={PALE} />
          {[58, 80, 102, 124, 146].map((y) => (
            <rect key={y} x="76" y={y} width="88" height="6" rx="3" fill={SKY} opacity={0.55} />
          ))}
          <rect x="200" y="110" width="22" height="58" rx="4" fill={BLUE} />
          <rect x="230" y="82" width="22" height="86" rx="4" fill={SKY} />
          <rect x="260" y="54" width="22" height="114" rx="4" fill={ORANGE} />
        </>
      );
    case "Programming": // brackets
    case "Web Designing":
      return (
        <>
          <rect x="54" y="38" width="212" height="128" rx="12" fill={DEEP} />
          <rect x="54" y="38" width="212" height="22" rx="11" fill={BLUE} />
          {[70, 84, 98].map((x) => (
            <circle key={x} cx={x} cy="49" r="4" fill={x === 70 ? ORANGE : PALE} opacity={x === 70 ? 1 : 0.6} />
          ))}
          <path d="M122 88 98 112l24 24" fill="none" stroke={ORANGE} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M198 88l24 24-24 24" fill="none" stroke={ORANGE} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M172 82l-24 60" stroke={PALE} strokeWidth="8" strokeLinecap="round" />
        </>
      );
    case "Computer Basics": // a keyboard, for typing and CCC
      return (
        <>
          <rect x="44" y="64" width="232" height="96" rx="12" fill={DEEP} />
          {[0, 1, 2].flatMap((row) =>
            Array.from({ length: 9 - row }, (_, i) => (
              <rect
                key={`${row}-${i}`}
                x={60 + row * 10 + i * 24}
                y={78 + row * 24}
                width="18"
                height="17"
                rx="3"
                fill={row === 1 && i === 3 ? ORANGE : BLUE}
              />
            )),
          )}
          <rect x="108" y="140" width="104" height="12" rx="4" fill={SKY} />
        </>
      );
    case "Multimedia": // timeline tracks with keyframe diamonds, and a wireframe solid
    default:
      return (
        <>
          {[64, 102, 140].map((y, row) => (
            <g key={y}>
              <line x1="40" y1={y} x2="190" y2={y} stroke={SKY} strokeWidth="3" strokeLinecap="round" />
              {[70 + row * 18, 130 - row * 10, 172].map((x) => (
                <path key={x} d={`M${x} ${y - 8}l8 8-8 8-8-8Z`} fill={ORANGE} />
              ))}
            </g>
          ))}
          <path d="M240 58l44 24v48l-44 24-44-24V82Z" fill="none" stroke={PALE} strokeWidth="3" strokeLinejoin="round" />
          <path d="M196 82l44 24 44-24M240 106v48" fill="none" stroke={PALE} strokeWidth="3" strokeLinejoin="round" />
        </>
      );
  }
}

export function CourseArt({ category, className }: { category: CourseCategory; className?: string }) {
  return (
    <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden className={className}>
      <rect width="320" height="200" fill={NAVY} />
      <Motif category={category} />
    </svg>
  );
}
