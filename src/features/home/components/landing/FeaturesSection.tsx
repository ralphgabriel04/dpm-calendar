"use client";

import { SectionHead, FeatureRow, LpGroup, DemoShell } from "./_shared";
import { modulesCopy as t } from "./copy";
import { CalendarProDemo } from "./demos/CalendarProDemo";
import { KanbanDemo } from "./demos/KanbanDemo";
import { MatrixDnD } from "./demos/MatrixDnD";
import { HabitTrackerDemo } from "./demos/HabitTrackerDemo";
import { GoalsProDemo } from "./demos/GoalsProDemo";
import { EnergyDemo } from "./demos/EnergyDemo";
import { StatsDemo } from "./demos/StatsDemo";
import { RulesDemo } from "./demos/RulesDemo";
import { ColorCustomizerDemo } from "./demos/ColorCustomizerDemo";
import { DailyPlanningDemo } from "./demos/DailyPlanningDemo";
import { FocusProDemo } from "./demos/FocusProDemo";
import { HealthSleepDemo } from "./demos/HealthSleepDemo";
import { SpacesDemo } from "./demos/SpacesDemo";

/* Modules — the playable product tour. Disposition mirrors the DPM Elevate
   prototype exactly: six grouped clusters, rows 01–13, alternating sides. */
export function FeaturesSection() {
  return (
    <section id="modules" className="relative scroll-mt-24 pt-12">
      <span id="features" className="absolute -top-24" aria-hidden />
      <div className="mx-auto max-w-[1180px] px-6">
        <SectionHead n="02" label={t.modules.label} title={t.modules.title} sub={t.modules.sub} />
      </div>

      <div id="try" className="mx-auto mt-14 max-w-[1180px] space-y-20 px-6 pb-16 sm:space-y-24">
        {/* Calendar & sharing */}
        <LpGroup label={t.groups.calendar} />
        <FeatureRow n="01" tag={t.calendarPro.tag} title={t.calendarPro.title} desc={t.calendarPro.desc} bullets={t.calendarPro.bullets}>
          <DemoShell hint={t.calendarPro.hint}>
            <CalendarProDemo />
          </DemoShell>
        </FeatureRow>

        {/* Daily rituals */}
        <LpGroup label={t.groups.rituals} />
        <FeatureRow n="02" reverse tag={t.daily.tag} title={t.daily.title} desc={t.daily.desc} bullets={t.daily.bullets}>
          <DemoShell hint={t.daily.hint}>
            <DailyPlanningDemo />
          </DemoShell>
        </FeatureRow>
        <FeatureRow n="03" tag={t.focusPro.tag} title={t.focusPro.title} desc={t.focusPro.desc} bullets={t.focusPro.bullets}>
          <DemoShell hint={t.focusPro.hint}>
            <FocusProDemo />
          </DemoShell>
        </FeatureRow>

        {/* Productivity */}
        <LpGroup label={t.groups.productivity} />
        <FeatureRow n="04" reverse tag={t.tasksPro.tag} title={t.tasksPro.title} desc={t.tasksPro.desc} bullets={t.tasksPro.bullets}>
          <DemoShell hint={t.tasksPro.hint}>
            <KanbanDemo />
          </DemoShell>
        </FeatureRow>
        <FeatureRow n="05" tag={t.matrix.tag} title={t.matrix.title} desc={t.matrix.desc} bullets={t.matrix.bullets}>
          <DemoShell hint={t.matrix.hint}>
            <MatrixDnD />
          </DemoShell>
        </FeatureRow>
        <FeatureRow n="06" reverse tag={t.habits.tag} title={t.habits.title} desc={t.habits.desc} bullets={t.habits.bullets}>
          <DemoShell hint={t.habits.hint}>
            <HabitTrackerDemo />
          </DemoShell>
        </FeatureRow>
        <FeatureRow n="07" tag={t.goalsPro.tag} title={t.goalsPro.title} desc={t.goalsPro.desc} bullets={t.goalsPro.bullets}>
          <DemoShell>
            <GoalsProDemo />
          </DemoShell>
        </FeatureRow>

        {/* Well-being */}
        <LpGroup label={t.groups.wellbeing} />
        <FeatureRow n="08" reverse tag={t.health.tag} title={t.health.title} desc={t.health.desc} bullets={t.health.bullets}>
          <DemoShell>
            <HealthSleepDemo />
          </DemoShell>
        </FeatureRow>
        <FeatureRow n="09" tag={t.energy.tag} title={t.energy.title} desc={t.energy.desc} bullets={t.energy.bullets}>
          <DemoShell hint={t.energy.hint}>
            <EnergyDemo />
          </DemoShell>
        </FeatureRow>

        {/* Insights & automation */}
        <LpGroup label={t.groups.insights} />
        <FeatureRow n="10" reverse tag={t.stats2.tag} title={t.stats2.title} desc={t.stats2.desc} bullets={t.stats2.bullets}>
          <DemoShell>
            <StatsDemo />
          </DemoShell>
        </FeatureRow>
        <FeatureRow n="11" tag={t.rules.tag} title={t.rules.title} desc={t.rules.desc} bullets={t.rules.bullets}>
          <DemoShell hint={t.rules.hint}>
            <RulesDemo />
          </DemoShell>
        </FeatureRow>

        {/* Make it yours */}
        <LpGroup label={t.groups.personalize} />
        <FeatureRow n="12" reverse tag={t.spaces.tag} title={t.spaces.title} desc={t.spaces.desc} bullets={t.spaces.bullets}>
          <DemoShell hint={t.spaces.hint}>
            <SpacesDemo />
          </DemoShell>
        </FeatureRow>
        <FeatureRow n="13" tag={t.customize.tag} title={t.customize.title} desc={t.customize.desc} bullets={t.customize.bullets}>
          <DemoShell hint={t.customize.hint}>
            <ColorCustomizerDemo />
          </DemoShell>
        </FeatureRow>
      </div>
    </section>
  );
}
