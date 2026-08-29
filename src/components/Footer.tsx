import { TumblingMark } from "@/components/ui/TumblingMark";
import { navLinks } from "@/lib/content";
import { programDetails, siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="relative border-t border-cream/10 bg-night">
      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* ---- Identity ---- */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              {/* Slower than the header's: down here it is a sign-off, not a
                  masthead. Aria-hidden — the wordmark beside it names the brand. */}
              <TumblingMark className="h-8 w-16" seconds={20} />
              <span className="text-sm font-semibold tracking-[0.2em] text-cream uppercase">
                {siteConfig.name}
              </span>
            </div>

            <p className="mt-6 font-serif text-h3 text-honey italic">{siteConfig.tagline}</p>

            <p className="mt-6 max-w-sm text-body text-cream-dim">
              {siteConfig.program} — a {programDetails.days}-day live psychological growth
              journey, {programDetails.dateLabel}.
            </p>
          </div>

          {/* ---- Navigation ---- */}
          <nav aria-label="Footer" className="lg:col-span-3">
            <h2 className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
              Explore
            </h2>
            <ul className="mt-6 flex flex-col gap-3.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="link-underline text-body text-cream-muted transition-colors hover:text-honey"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#register"
                  className="link-underline text-body text-honey transition-colors"
                >
                  Register
                </a>
              </li>
            </ul>
          </nav>

          {/* ---- Contact ---- */}
          <div className="lg:col-span-4">
            <h2 className="text-eyebrow font-semibold tracking-[0.18em] text-cream-dim uppercase">
              Contact
            </h2>
            <ul className="mt-6 flex flex-col gap-3.5">
              <li>
                <a
                  href={siteConfig.contact.websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline text-body text-cream-muted transition-colors hover:text-honey"
                >
                  {siteConfig.contact.website}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.contact.phoneHref}
                  className="link-underline text-body text-cream-muted transition-colors hover:text-honey"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.contact.emailHref}
                  className="link-underline text-body text-cream-muted transition-colors hover:text-honey"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="rule-gold mt-14 opacity-50" />

        <div className="mt-8 flex flex-col gap-3 text-sm text-cream-dim sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 {siteConfig.name}. All rights reserved.</p>
          <p>
            Led by {}
            <a
              href={siteConfig.contact.websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-cream-muted"
            >
              Kaleeswaran K
            </a>
            , Counselling Psychologist.
          </p>
        </div>
      </div>
    </footer>
  );
}
