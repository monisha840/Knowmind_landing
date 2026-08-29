/**
 * Premium 2D stand-in for the growth object, used when WebGL is unavailable.
 *
 * Same idea, drawn in CSS and SVG: concentric rings around a warm centre.
 * No canvas, no JS, no layout shift.
 */
export function Fallback2D({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* Deep field wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 72% 38%, rgba(90,35,72,0.55) 0%, rgba(59,28,90,0.28) 38%, transparent 70%)",
        }}
      />

      {/* Rings + centre */}
      <svg
        viewBox="0 0 600 600"
        className="absolute top-1/2 left-1/2 h-[min(85vh,42rem)] w-[min(85vh,42rem)] -translate-x-1/2 -translate-y-1/2 opacity-70 md:left-[72%]"
      >
        <defs>
          <radialGradient id="fbCore" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#feb737" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#8a4a72" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b1c5a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="300" cy="300" r="210" fill="url(#fbCore)" />

        <g fill="none" strokeWidth="1">
          <ellipse cx="300" cy="300" rx="196" ry="74" stroke="#e6b44c" strokeOpacity="0.4" transform="rotate(-18 300 300)" />
          <ellipse cx="300" cy="300" rx="238" ry="112" stroke="#a0538c" strokeOpacity="0.34" transform="rotate(26 300 300)" />
          <ellipse cx="300" cy="300" rx="278" ry="150" stroke="#feb737" strokeOpacity="0.2" transform="rotate(-52 300 300)" />
          <circle cx="300" cy="300" r="146" stroke="#c98fb8" strokeOpacity="0.16" />
        </g>

        <circle cx="300" cy="300" r="7" fill="#feb737" />
      </svg>
    </div>
  );
}
