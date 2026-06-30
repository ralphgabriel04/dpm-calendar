"use client";

import { SectionHead } from "./_shared";
import { ReviewsGrid } from "./demos/ReviewsGrid";
import { modulesCopy as t } from "./copy";

/* Reviews / social proof (section 05). */
export function ReviewsSection() {
  return (
    <section className="relative mx-auto max-w-[1180px] px-6 py-16">
      <SectionHead n="05" label={t.reviews.label} title={t.reviews.title} sub={t.reviews.sub} />
      <div className="mt-12">
        <ReviewsGrid />
      </div>
    </section>
  );
}
