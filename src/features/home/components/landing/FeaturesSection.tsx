"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, Target, Layers, Eye, BarChart3, ChevronDown, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { colorStyles } from "./constants";

// Skeleton for mockup loading
function MockupSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lg animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-20 bg-muted rounded w-full" />
      </div>
    </div>
  );
}

// Dynamic imports for mockups
const TimeInsightsMockup = dynamic(
  () => import("./mockups/TimeInsightsMockup").then((mod) => ({ default: mod.TimeInsightsMockup })),
  { ssr: false, loading: () => <MockupSkeleton /> }
);

const FocusModeMockup = dynamic(
  () => import("./mockups/FocusModeMockup").then((mod) => ({ default: mod.FocusModeMockup })),
  { ssr: false, loading: () => <MockupSkeleton /> }
);

const MultiCalendarMockup = dynamic(
  () => import("./mockups/MultiCalendarMockup").then((mod) => ({ default: mod.MultiCalendarMockup })),
  { ssr: false, loading: () => <MockupSkeleton /> }
);

const CustomViewsMockup = dynamic(
  () => import("./mockups/CustomViewsMockup").then((mod) => ({ default: mod.CustomViewsMockup })),
  { ssr: false, loading: () => <MockupSkeleton /> }
);

const GoalsMockup = dynamic(
  () => import("./mockups/GoalsMockup").then((mod) => ({ default: mod.GoalsMockup })),
  { ssr: false, loading: () => <MockupSkeleton /> }
);

export function FeaturesSection() {
  const tFeatures = useTranslations("landing.features");
  const [activeFeature, setActiveFeature] = useState<string>("time-tracking");

  const featureData = [
    {
      id: "time-tracking",
      title: tFeatures("timeTracking.title"),
      icon: Clock,
      color: "violet",
      description: tFeatures("timeTracking.description"),
      features: [
        tFeatures("timeTracking.feature1"),
        tFeatures("timeTracking.feature2"),
        tFeatures("timeTracking.feature3"),
      ],
      MockupComponent: TimeInsightsMockup,
    },
    {
      id: "focus-mode",
      title: tFeatures("focusMode.title"),
      icon: Target,
      color: "emerald",
      description: tFeatures("focusMode.description"),
      features: [
        tFeatures("focusMode.feature1"),
        tFeatures("focusMode.feature2"),
        tFeatures("focusMode.feature3"),
      ],
      MockupComponent: FocusModeMockup,
    },
    {
      id: "multi-calendar",
      title: tFeatures("multiCalendar.title"),
      icon: Layers,
      color: "blue",
      description: tFeatures("multiCalendar.description"),
      features: [
        tFeatures("multiCalendar.feature1"),
        tFeatures("multiCalendar.feature2"),
        tFeatures("multiCalendar.feature3"),
      ],
      MockupComponent: MultiCalendarMockup,
    },
    {
      id: "custom-views",
      title: tFeatures("customViews.title"),
      icon: Eye,
      color: "orange",
      description: tFeatures("customViews.description"),
      features: [
        tFeatures("customViews.feature1"),
        tFeatures("customViews.feature2"),
        tFeatures("customViews.feature3"),
      ],
      MockupComponent: CustomViewsMockup,
    },
    {
      id: "goals",
      title: tFeatures("goals.title"),
      icon: BarChart3,
      color: "pink",
      description: tFeatures("goals.description"),
      features: [
        tFeatures("goals.feature1"),
        tFeatures("goals.feature2"),
        tFeatures("goals.feature3"),
      ],
      MockupComponent: GoalsMockup,
    },
  ];

  return (
    <section id="features" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Accordion */}
          <div className="space-y-0">
            {featureData.map((feature) => {
              const isActive = activeFeature === feature.id;
              const colors = colorStyles[feature.color];

              return (
                <div
                  key={feature.id}
                  className="border-l-4 transition-colors"
                  style={{ borderColor: isActive ? colors.border : "transparent" }}
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => setActiveFeature(feature.id)}
                    className="w-full text-left py-4 px-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-lg font-semibold transition-colors ${
                          isActive ? "" : "text-muted-foreground"
                        }`}
                        style={isActive ? { color: colors.text } : undefined}
                      >
                        {feature.title}
                      </h3>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform duration-300 ${
                          isActive ? "rotate-180" : ""
                        }`}
                        style={isActive ? { color: colors.text } : undefined}
                      />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isActive ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-4 pb-6">
                      <p className="text-muted-foreground mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.features.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm">
                            <div
                              className="flex h-5 w-5 items-center justify-center rounded-full"
                              style={{ backgroundColor: colors.bg }}
                            >
                              <Check className="h-3 w-3" style={{ color: colors.text }} />
                            </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Mobile Mockup */}
                      <div className="mt-6 lg:hidden">
                        <feature.MockupComponent />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Mockup (Desktop) */}
          <div className="hidden lg:flex items-start justify-center sticky top-24">
            {featureData.map((feature) => {
              if (feature.id !== activeFeature) return null;
              return (
                <div
                  key={feature.id}
                  className="w-full max-w-sm animate-in fade-in duration-300"
                >
                  <feature.MockupComponent />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
