"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";

import { REGISTER_ANCHOR, RAZORPAY_PAYMENT_LINK, isPaymentConfigured } from "@/lib/config";
import { usePrefersReducedMotion } from "@/lib/hooks";

type Variant = "primary" | "outline" | "ghost";
type Size = "md" | "lg";

type CTAButtonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Override the destination. Defaults to the Razorpay link / register anchor. */
  href?: string;
  /** Analytics / testing hook. */
  id?: string;
  /** Fires alongside navigation — used to close the mobile drawer. */
  onClick?: () => void;
};

const base =
  "group relative inline-flex items-center justify-center gap-2.5 rounded-full font-semibold " +
  "tracking-tight whitespace-nowrap transition-colors duration-300 " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-honey";

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-[0.9375rem]",
  lg: "px-8 py-4 text-base sm:px-10 sm:py-[1.125rem] sm:text-lg",
};

const variants: Record<Variant, string> = {
  primary: "bg-honey text-wine-950 hover:bg-honey-400",
  outline:
    "border border-cream/25 text-cream hover:border-honey/70 hover:text-honey backdrop-blur-sm",
  ghost: "text-cream/80 hover:text-honey",
};

/**
 * The page's one call-to-action component.
 *
 * Destination logic: when `NEXT_PUBLIC_RAZORPAY_PAYMENT_LINK` is set every CTA
 * opens Razorpay directly. Until then they scroll to the registration section
 * rather than pointing at a URL that does not exist yet.
 */
export function CTAButton({
  children,
  variant = "primary",
  size = "lg",
  className = "",
  href,
  id,
  onClick,
}: CTAButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = usePrefersReducedMotion();

  // Magnetic pull — the button leans a few pixels toward the cursor.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 260, damping: 22, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 260, damping: 22, mass: 0.5 });
  const x = useTransform(sx, (v) => (reduced ? 0 : v));
  const y = useTransform(sy, (v) => (reduced ? 0 : v));

  const destination = href ?? (isPaymentConfigured ? RAZORPAY_PAYMENT_LINK : REGISTER_ANCHOR);
  const isExternal = destination.startsWith("http");

  const onPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // Cap the pull so it stays a hint, never a toy.
    mx.set(((e.clientX - rect.left - rect.width / 2) / rect.width) * 14);
    my.set(((e.clientY - rect.top - rect.height / 2) / rect.height) * 10);
  };

  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.a
      ref={ref}
      id={id}
      href={destination}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onClick={onClick}
      style={{ x, y }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      data-payment-configured={isPaymentConfigured}
    >
      {/* Soft honey bloom behind the primary button on hover. */}
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-honey opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40"
        />
      )}
      <span>{children}</span>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        className="h-[1.1em] w-[1.1em] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1"
      >
        <path
          d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.a>
  );
}
