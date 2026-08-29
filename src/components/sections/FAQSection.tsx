import { Accordion } from "@/components/ui/Accordion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqItems } from "@/lib/content";
import { siteConfig } from "@/lib/config";

export function FAQSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="section-y relative bg-wine-950"
    >
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <SectionHeading eyebrow="Questions" title="Before you decide" />

              <Reveal delay={0.12}>
                <p className="mt-8 text-body text-cream-muted">
                  Still unsure about something? Write to{" "}
                  <a
                    href={siteConfig.contact.emailHref}
                    className="link-underline text-honey"
                  >
                    {siteConfig.contact.email}
                  </a>{" "}
                  or call{" "}
                  <a
                    href={siteConfig.contact.phoneHref}
                    className="link-underline text-honey"
                  >
                    {siteConfig.contact.phone}
                  </a>
                  .
                </p>
              </Reveal>
            </div>
          </div>

          <div className="lg:col-span-8">
            <h2 id="faq-heading" className="sr-only">
              Frequently asked questions
            </h2>
            <Accordion items={faqItems} tone="dark" defaultOpen={0} />
          </div>
        </div>
      </div>
    </section>
  );
}
