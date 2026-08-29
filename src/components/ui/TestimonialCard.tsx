import type { Testimonial } from "@/lib/content";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col justify-between rounded-card border border-ink/10 bg-paper p-7 transition-colors duration-500 hover:border-amber-ink/35 sm:p-8">
      <div>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-honey"
          role="presentation"
        >
          <path d="M9.4 5.5C6.3 7 4.5 9.9 4.5 13.4c0 3.1 1.9 5.1 4.4 5.1 2.2 0 3.9-1.6 3.9-3.7 0-2-1.4-3.5-3.3-3.5-.4 0-.8.1-1 .1.4-1.6 1.9-3.2 3.7-4.1l-2.8-1.8Zm9.1 0C15.4 7 13.6 9.9 13.6 13.4c0 3.1 1.9 5.1 4.4 5.1 2.2 0 3.9-1.6 3.9-3.7 0-2-1.4-3.5-3.3-3.5-.4 0-.8.1-1 .1.4-1.6 1.9-3.2 3.7-4.1l-2.8-1.8Z" />
        </svg>

        <blockquote className="mt-5">
          <p className="font-serif text-h3 leading-[1.35] text-ink italic">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
        </blockquote>
      </div>

      <figcaption className="mt-7 flex items-center gap-3 border-t border-ink/10 pt-5">
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-full bg-wine text-sm font-semibold text-cream"
        >
          {testimonial.name.charAt(0)}
        </span>
        <span className="text-sm font-medium text-ink">{testimonial.name}</span>
      </figcaption>
    </figure>
  );
}
