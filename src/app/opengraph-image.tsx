import { ImageResponse } from "next/og";

import { programDetails, siteConfig } from "@/lib/config";

export const alt =
  "1% Better. Every Day. — 14-Day Live Psychological Growth Journey by KnowMind Universe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated share card.
 *
 * Rendered at build time rather than shipped as a designed asset, so it can
 * never drift out of sync with the dates and price in `config.ts`.
 * Satori supports flexbox only — no grid, no external CSS.
 */
export default function OpengraphImage() {
  const facts = [
    programDetails.dateLabel,
    programDetails.timeShort,
    "Live on Zoom",
    `${programDetails.seats} seats`,
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(120% 110% at 78% 22%, #5a2348 0%, #3b1c5a 42%, #14060f 78%)",
          color: "#f8f0e9",
          fontFamily: "sans-serif",
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 54, height: 3, background: "#feb737" }} />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#feb737",
              fontWeight: 700,
            }}
          >
            {`${programDetails.days}-Day Live Psychological Growth Journey`}
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 132,
              fontWeight: 800,
              letterSpacing: -5,
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#feb737" }}>1%</span>
            <span style={{ marginLeft: 22 }}>Better.</span>
          </div>
          <div
            style={{
              fontSize: 132,
              fontWeight: 800,
              letterSpacing: -5,
              lineHeight: 1.05,
            }}
          >
            Every Day.
          </div>
        </div>

        {/* Facts + price */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(248,240,233,0.18)",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 26, fontSize: 24, color: "#c6b1bf" }}>
              {facts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2 }}>
              {siteConfig.name.toUpperCase()}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#feb737",
              color: "#1d0a18",
              padding: "16px 30px",
              borderRadius: 999,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            {`${programDetails.currencySymbol}${programDetails.price.toLocaleString("en-IN")}`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
