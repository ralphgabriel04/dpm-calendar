"use client";

import { SectionHead, FeatureRow, LpGroup, DemoShell } from "./_shared";
import { CalendarProDemo } from "./demos/CalendarProDemo";
import { KanbanDemo } from "./demos/KanbanDemo";
import { MatrixDnD } from "./demos/MatrixDnD";

/* Compact daily-planning timeline mockup. */
function DailyTimelineDemo() {
  const slots = [
    { t: "08:00", label: "Rituel matinal", kind: "habit" },
    { t: "09:30", label: "Deep work — Projet X", kind: "focus" },
    { t: "11:00", label: "Stand-up équipe", kind: "event" },
    { t: "14:00", label: "Pause + marche", kind: "break" },
  ];
  const color: Record<string, string> = {
    habit: "38 92% 55%",
    focus: "263 70% 60%",
    event: "217 91% 60%",
    break: "142 70% 45%",
  };
  return (
    <div className="rounded-[12px] border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12px] font-semibold">Aujourd&apos;hui</div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          Énergie
          <span className="ml-1 inline-flex gap-0.5">
            {[1, 1, 1, 0, 0].map((v, i) => (
              <span key={i} className={`h-3 w-1.5 rounded-sm ${v ? "bg-primary" : "bg-muted"}`} />
            ))}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {slots.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-9 font-mono text-[10px] text-muted-foreground">{s.t}</span>
            <div
              className="flex-1 rounded-[7px] border-l-[3px] px-2.5 py-1.5 text-[11px] font-medium"
              style={{ borderColor: `hsl(${color[s.kind]})`, background: `hsl(${color[s.kind]} / 0.08)` }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section id="modules" className="relative scroll-mt-24 pt-12">
      <span id="features" className="absolute -top-24" aria-hidden />
      <div className="mx-auto max-w-[1180px] px-6">
        <SectionHead
          n="02"
          label="Modules"
          title="Tout ton système, au même endroit"
          sub="Calendrier, tâches, habitudes, objectifs et bien-être — connectés, pas dispersés. Chaque module joue avec les autres."
        />
      </div>

      <div className="mx-auto mt-14 max-w-[1180px] space-y-20 px-6 pb-16 sm:space-y-24">
        {/* Calendar & sharing */}
        <LpGroup label="Calendrier & partage" />
        <FeatureRow
          n="01"
          tag="Calendrier"
          title="Glisse, planifie, partage en quelques secondes"
          desc="Un planning hebdo où tu déposes tes tâches là où elles vont — et l'IA te propose le créneau idéal selon ton énergie."
          bullets={[
            "Glisser-déposer depuis ta boîte de réception",
            "Créneau suggéré sur ton pic d'énergie",
            "Partage d'un lien en un clic",
          ]}
        >
          <DemoShell hint="Démo interactive — glisse une tâche sur la grille">
            <CalendarProDemo />
          </DemoShell>
        </FeatureRow>

        {/* Daily rituals */}
        <LpGroup label="Rituels quotidiens" />
        <FeatureRow
          n="02"
          reverse
          tag="Planning du jour"
          title="Commence chaque journée avec un plan clair"
          desc="Tes rituels, ton deep work et tes rendez-vous alignés sur ton énergie réelle — pas sur une to-do interminable."
          bullets={[
            "Plan du jour généré automatiquement",
            "Suivi d'énergie intégré",
            "Blocs de focus protégés",
          ]}
        >
          <DemoShell hint="Aperçu du plan quotidien">
            <DailyTimelineDemo />
          </DemoShell>
        </FeatureRow>

        {/* Productivity */}
        <LpGroup label="Productivité" />
        <FeatureRow
          n="03"
          tag="Tâches"
          title="Kanban, liste ou matrice — comme tu préfères"
          desc="Organise tes tâches avec priorités, sous-tâches et énergie requise. Bascule entre les vues sans rien perdre."
          bullets={[
            "Vues Kanban, liste et matrice d'Eisenhower",
            "Priorités, tags et sous-tâches",
            "Une tâche → un bloc dans ton calendrier",
          ]}
        >
          <DemoShell hint="Démo interactive — glisse une carte entre les colonnes">
            <KanbanDemo />
          </DemoShell>
        </FeatureRow>

        <FeatureRow
          n="04"
          reverse
          tag="Matrice d'Eisenhower"
          title="Priorise par impact, pas par urgence ressentie"
          desc="Glisse chaque tâche dans le bon quadrant — faire, planifier, déléguer ou abandonner. Tu vois d'un coup d'œil où mettre ton énergie."
          bullets={[
            "Glisser-déposer entre les 4 quadrants",
            "Couleurs par niveau d'urgence / importance",
            "Connecté à tes tâches et ton calendrier",
          ]}
        >
          <DemoShell hint="Glisse une tâche entre les quadrants">
            <MatrixDnD />
          </DemoShell>
        </FeatureRow>
      </div>
    </section>
  );
}
