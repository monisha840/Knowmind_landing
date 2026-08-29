"use client";

import { motion } from "motion/react";
import { useId } from "react";

import { inr, programDetails, siteConfig } from "@/lib/config";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * The refund, as an object you could hold.
 *
 * A cheque envelope with the notes still showing above the edge and REFUND
 * struck across it — the promise made tangible instead of stated twice. Drawn
 * rather than photographed so it scales cleanly, costs no request and carries
 * KnowMind's own marks: the notes are rupees, the sender is KnowMind, and the
 * stamp is wine violet, the way a real rubber stamp is whatever colour the
 * office had.
 *
 * Decorative: the promise itself is the heading and body copy beside it.
 */
export function RefundEnvelope({ className = "" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  // Namespaced so a second instance on the page cannot steal these defs.
  const uid = useId().replace(/:/g, "");
  const ink = `${uid}-ink`;
  const wear = `${uid}-wear`;
  const note = `${uid}-note`;
  const shadow = `${uid}-shadow`;

  return (
    <svg
      viewBox="0 0 520 340"
      className={className}
      role="presentation"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Roughens the stamp's edge the way pressed rubber does. */}
        <filter id={ink} x="-8%" y="-30%" width="116%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.7" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Ink that did not take, in a few thin bands. */}
        <mask id={wear}>
          <rect width="520" height="340" fill="#fff" />
          <g fill="#000">
            <rect x="120" y="243" width="300" height="2.4" opacity="0.55" />
            <rect x="176" y="258" width="150" height="1.8" opacity="0.4" />
            <rect x="250" y="276" width="210" height="2.2" opacity="0.5" />
            <rect x="140" y="290" width="90" height="1.6" opacity="0.35" />
          </g>
        </mask>

        <linearGradient id={note} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd98a" />
          <stop offset="55%" stopColor="#e6b44c" />
          <stop offset="100%" stopColor="#d09a2f" />
        </linearGradient>

        <filter id={shadow} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#0c0410" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* ---------------- Notes, still in the envelope ---------------- */}
      <g>
        {[
          { x: 104, y: 18, r: -9 },
          { x: 118, y: 30, r: -6 },
          { x: 132, y: 42, r: -3 },
        ].map((n, i) => (
          <g key={n.r} transform={`rotate(${n.r} ${n.x + 105} ${n.y + 50})`}>
            <rect
              x={n.x}
              y={n.y}
              width="210"
              height="100"
              rx="5"
              fill={`url(#${note})`}
              stroke="#b8831f"
              strokeWidth="1"
            />
            <rect
              x={n.x + 8}
              y={n.y + 8}
              width="194"
              height="84"
              rx="3"
              fill="none"
              stroke="#b8831f"
              strokeWidth="0.8"
              opacity="0.55"
            />
            {i === 2 && (
              <>
                <circle cx={n.x + 105} cy={n.y + 50} r="24" fill="none" stroke="#b8831f" strokeWidth="0.9" opacity="0.7" />
                <text
                  x={n.x + 105}
                  y={n.y + 60}
                  textAnchor="middle"
                  className="font-sans"
                  fontSize="30"
                  fontWeight="700"
                  fill="#8a5a0a"
                >
                  ₹
                </text>
                <text x={n.x + 18} y={n.y + 26} className="font-sans" fontSize="9" fontWeight="700" fill="#8a5a0a" letterSpacing="0.5">
                  {inr(programDetails.price)}
                </text>
                <text x={n.x + 152} y={n.y + 86} className="font-sans" fontSize="9" fontWeight="700" fill="#8a5a0a" letterSpacing="0.5">
                  {inr(programDetails.price)}
                </text>
              </>
            )}
          </g>
        ))}
      </g>

      {/* ---------------- The envelope ---------------- */}
      <g transform="rotate(-1.6 260 226)" filter={`url(#${shadow})`}>
        <rect x="28" y="118" width="464" height="206" rx="4" fill="#fbf7f2" />
        <rect
          x="28.5"
          y="118.5"
          width="463"
          height="205"
          rx="4"
          fill="none"
          stroke="#240d1e"
          strokeOpacity="0.16"
        />
        {/* The fold, caught by the light. */}
        <path d="M28 118h464v6H28z" fill="#240d1e" opacity="0.05" />

        {/* ---- Sender ---- */}
        <g>
          <circle cx="62" cy="152" r="7.5" fill="none" stroke="#e6b44c" strokeWidth="3" />
          <circle cx="76" cy="152" r="7.5" fill="none" stroke="#5a2348" strokeWidth="3" />
          <text x="94" y="149" className="font-sans" fontSize="8.5" fontWeight="700" fill="#3b1c5a" letterSpacing="1.3">
            {siteConfig.name.toUpperCase()}
          </text>
          <text x="94" y="161" className="font-serif" fontSize="9" fontStyle="italic" fill="#6c5461">
            {siteConfig.program}
          </text>
        </g>

        {/* ---- What is inside ---- */}
        <g>
          <rect
            x="188"
            y="176"
            width="192"
            height="40"
            rx="2"
            fill="#5a2348"
            fillOpacity="0.05"
            stroke="#5a2348"
            strokeWidth="1"
            strokeDasharray="4 2.5"
          />
          <text x="284" y="191" textAnchor="middle" className="font-sans" fontSize="7.2" fontWeight="700" fill="#5a2348" letterSpacing="0.9">
            ENCLOSED IS THE REFUND YOU WERE
          </text>
          <text x="284" y="204" textAnchor="middle" className="font-sans" fontSize="7.2" fontWeight="700" fill="#5a2348" letterSpacing="0.9">
            PROMISED — NO QUESTIONS ASKED
          </text>
        </g>

        {/* ---- Permit block ---- */}
        <g>
          <rect
            x="400"
            y="134"
            width="72"
            height="48"
            rx="2"
            fill="none"
            stroke="#240d1e"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
          <text x="436" y="150" textAnchor="middle" className="font-sans" fontSize="6.4" fontWeight="600" fill="#6c5461" letterSpacing="0.8">
            REFUNDED
          </text>
          <text x="436" y="163" textAnchor="middle" className="font-sans" fontSize="9.5" fontWeight="700" fill="#240d1e">
            {inr(programDetails.price)}
          </text>
          <text x="436" y="175" textAnchor="middle" className="font-sans" fontSize="6.4" fontWeight="600" fill="#6c5461" letterSpacing="0.8">
            IN FULL
          </text>
        </g>

      </g>

      {/* ---------------- Stamped ---------------- */}
      <motion.g
        transform="rotate(-4.5 300 262)"
        initial={reduced ? false : { opacity: 0, scale: 1.14 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.45, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "300px 262px" }}
      >
        <text
          x="146"
          y="292"
          className="font-sans"
          fontSize="78"
          fontWeight="800"
          fill="#5a2348"
          fillOpacity="0.9"
          letterSpacing="2"
          filter={`url(#${ink})`}
          mask={`url(#${wear})`}
        >
          REFUND
        </text>
      </motion.g>
    </svg>
  );
}
