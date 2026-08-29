"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { CTAButton } from "@/components/ui/CTAButton";
import { navLinks } from "@/lib/content";
import { siteConfig } from "@/lib/config";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the mobile drawer and allow Escape to close it.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          scrolled
            ? "border-b border-cream/10 bg-night/75 backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <nav
          aria-label="Primary"
          className={`container-page flex items-center justify-between transition-all duration-500 ${
            scrolled ? "h-16" : "h-20 sm:h-24"
          }`}
        >
          {/* Wordmark */}
          <a
            href="#top"
            className="group flex items-center gap-3"
            aria-label={`${siteConfig.name} — home`}
          >
            <Image
              src="/brand/logo.png"
              alt=""
              width={703}
              height={380}
              priority
              className={`w-auto transition-all duration-500 ${scrolled ? "h-6" : "h-7 sm:h-8"}`}
            />
            <span className="hidden text-[0.7rem] font-semibold tracking-[0.2em] text-cream uppercase transition-colors group-hover:text-honey sm:block">
              KnowMind Universe
            </span>
          </a>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="link-underline text-sm font-medium text-cream/75 transition-colors hover:text-honey"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {/* Wrapper, not a `hidden` class on the button: the button already
                sets `inline-flex`, and two display utilities on one element
                resolve by stylesheet order rather than by breakpoint. */}
            <div className="hidden sm:block">
              <CTAButton size="md">Begin Your Journey</CTAButton>
            </div>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="grid h-11 w-11 place-items-center rounded-full border border-cream/20 text-cream transition-colors hover:border-honey/60 hover:text-honey lg:hidden"
            >
              <span className="relative block h-3 w-5">
                <span
                  className={`absolute left-0 block h-px w-5 bg-current transition-all duration-300 ${
                    menuOpen ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-5 bg-current transition-all duration-300 ${
                    menuOpen ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>

        {/* Reading progress — the page's own 1% meter. */}
        <motion.div
          aria-hidden
          className="h-px origin-left bg-honey"
          style={{ scaleX: progress, opacity: scrolled ? 1 : 0 }}
        />
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-night/97 backdrop-blur-2xl lg:hidden"
          >
            <div className="container-page flex h-full flex-col justify-center pt-24 pb-16">
              <ul className="flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block border-b border-cream/10 py-5 text-h3 font-medium text-cream transition-colors hover:text-honey"
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.45 }}
                className="mt-10"
              >
                <CTAButton className="w-full" size="lg" onClick={() => setMenuOpen(false)}>
                  Begin Your 1% Journey
                </CTAButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
