import dynamic from "next/dynamic";
import { Navigation } from "@/features/home/components/landing/Navigation";
import { HeroSection } from "@/features/home/components/landing/HeroSection";
import { ScrollControls } from "@/features/home/components/landing/ScrollControls";
import { CTASection } from "@/features/home/components/landing/CTASection";
import { FooterSection } from "@/features/home/components/landing/FooterSection";

// Section skeleton for loading states
function SectionSkeleton() {
  return (
    <div className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-1/2 mx-auto mb-4" />
          <div className="h-6 bg-muted rounded w-2/3 mx-auto mb-12" />
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic imports for heavier sections (below the fold)
const HowItWorksSection = dynamic(
  () => import("@/features/home/components/landing/HowItWorksSection").then((mod) => ({ default: mod.HowItWorksSection })),
  { loading: () => <SectionSkeleton /> }
);

const FeaturesSection = dynamic(
  () => import("@/features/home/components/landing/FeaturesSection").then((mod) => ({ default: mod.FeaturesSection })),
  { loading: () => <SectionSkeleton /> }
);

const AISpotlightSection = dynamic(
  () => import("@/features/home/components/landing/AISpotlightSection").then((mod) => ({ default: mod.AISpotlightSection })),
  { loading: () => <SectionSkeleton /> }
);

const ResourcesSection = dynamic(
  () => import("@/features/home/components/landing/ResourcesSection").then((mod) => ({ default: mod.ResourcesSection })),
  { loading: () => <SectionSkeleton /> }
);

const ReviewsSection = dynamic(
  () => import("@/features/home/components/landing/ReviewsSection").then((mod) => ({ default: mod.ReviewsSection })),
  { loading: () => <SectionSkeleton /> }
);

const SecuritySection = dynamic(
  () => import("@/features/home/components/landing/SecuritySection").then((mod) => ({ default: mod.SecuritySection })),
  { loading: () => <SectionSkeleton /> }
);

const PricingSection = dynamic(
  () => import("@/features/home/components/landing/PricingSection").then((mod) => ({ default: mod.PricingSection })),
  { loading: () => <SectionSkeleton /> }
);

const FaqSection = dynamic(
  () => import("@/features/home/components/landing/FaqSection").then((mod) => ({ default: mod.FaqSection })),
  { loading: () => <SectionSkeleton /> }
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollControls />
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <AISpotlightSection />
      <ResourcesSection />
      <ReviewsSection />
      <SecuritySection />
      <PricingSection />
      <FaqSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
