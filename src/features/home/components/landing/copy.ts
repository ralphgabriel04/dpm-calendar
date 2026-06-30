/* ============================================================
   LANDING — Modules section copy (FR), verbatim from the DPM Elevate
   design prototype (landing-copy.jsx / landing-copy2.jsx). The landing
   renders from this dictionary so titles/desc/bullets/hint and demo data
   stay faithful to the source. FR is the default locale.
============================================================ */

export const modulesCopy = {
  modules: {
    label: "Chaque module, jouable",
    title: "Rien à imaginer. Essayez ci-dessous.",
    sub: "Ce sont de vrais aperçus interactifs du produit. Glissez, cliquez, complétez — exactement comme dans DPM Elevate.",
  },

  groups: {
    calendar: "Agenda & partage",
    rituals: "Rituels quotidiens",
    productivity: "Productivité",
    wellbeing: "Bien-être",
    insights: "Analytics & automatisation",
    personalize: "À votre image",
  },

  calendarPro: {
    tag: "Agenda · planifier & partager",
    title: "Glissez une tâche. Recevez un créneau. Partagez-le.",
    desc: "Glissez une tâche non planifiée sur la semaine et elle devient un bloc horaire. DPM propose le meilleur créneau libre selon votre énergie — partagez un créneau en un clic, ou planifiez demain automatiquement.",
    bullets: [
      "Événements, tâches & sessions de focus dans une grille",
      "Suggestions de créneaux intelligentes",
      "Partagez un créneau ou planifiez demain en un tap",
    ],
    hint: "↓ Glissez une tâche de la boîte sur la grille",
  },

  daily: {
    tag: "Rituel de planification",
    title: "Transformez une liste floue en vraie journée.",
    desc: "Un assistant en six étapes vous mène du vide-cerveau à une journée posée dans l'agenda — une décision à la fois, en deux minutes environ.",
    bullets: [
      "Six étapes guidées, zéro surcharge",
      "Estimations de temps honnêtes",
      "Placé autour de votre énergie",
    ],
    hint: "↓ Parcourez les six étapes",
    placeholder: "Ajouter une tâche…",
    addedNote: "Vos tâches traversent chaque étape",
    steps: [
      { k: "Ajouter", d: "Videz toutes les tâches" },
      { k: "Estimer", d: "Combien de temps ?" },
      { k: "Remplir", d: "Tirez habitudes & événements" },
      { k: "Prioriser", d: "Urgent × important" },
      { k: "Planifier", d: "Déposez dans l'agenda" },
      { k: "Documenter", d: "Notez le plan de demain" },
    ],
  },

  focusPro: {
    tag: "Focus · deep work",
    title: "Une tâche, verrouillée. Musique. C'est parti.",
    desc: "Verrouillez la tâche du haut à votre session, l'anneau cadence focus et pauses, et DPM fait taire les distractions — la musique baisse même pendant les pauses. L'hyperfocus enchaîne les blocs quand vous êtes lancé.",
    bullets: [
      "Verrouillez une tâche à la session",
      "Anneau focus / pause + compteur de pauses",
      "Connectez Spotify · Apple · YouTube",
    ],
    hint: "↓ Verrouillez une tâche, lancez, connectez la musique",
    locked: "Verrouillée à la session",
    lock: "Verrouiller",
    breaks: "pauses",
    tasks: ["Écrire le deck T2", "Refactor module auth", "Relire 2 PR"],
    focusToast: "Retour au focus ↑",
    breakToast: "C'est la pause ☕",
  },

  tasksPro: {
    tag: "Tâches · 5 vues & tableaux",
    title: "Le même travail, cinq angles.",
    desc: "Liste pour cocher, Tableaux pour le flux, Timeline pour les échéances, Calendrier pour planifier, Stats pour le recul. Glissez les cartes dans un Kanban avec limites WIP et assignations — avec une petite célébration à l'arrivée en Terminé.",
    bullets: [
      "Liste · Tableau · Timeline · Calendrier · Stats",
      "Kanban avec limites WIP & assignations",
      "Animation d'arrivée personnalisée par colonne",
    ],
    hint: "↓ Changez de vue, puis glissez une carte vers Terminé",
  },

  matrix: {
    tag: "Priorisation · Glisser-déposer",
    title: "Décidez ce qui mérite vraiment votre temps.",
    desc: "La matrice d'Eisenhower transforme une liste en désordre en quatre quadrants honnêtes. Glissez une tâche — la décision reste visuelle et réversible.",
    bullets: [
      "Urgent × Important, d'un regard",
      "Glissez les tâches entre quadrants",
      "Ce qui peut attendre… attend",
    ],
    hint: "↓ Glissez une tâche dans un autre quadrant",
  },

  habits: {
    tag: "Habitudes & routines",
    title: "Des séries qui survivent vraiment.",
    desc: "Tapez chaque jour où vous êtes au rendez-vous. La série grandit, la flamme s'allume — la pression douce qui maintient les routines.",
    bullets: [
      "Check-in quotidien en un tap",
      "Séries visuelles & records",
      "Des routines qui s'adaptent à la semaine",
    ],
    hint: "↓ Tapez les jours où vous étiez présent",
    habit: "Course matinale",
    streak: "jours de série",
    week: ["L", "M", "M", "J", "V", "S", "D"],
  },

  goalsPro: {
    tag: "Objectifs · cadrés SMART",
    title: "D'un vœu flou à une progression mesurée.",
    desc: "Chaque objectif montre où vous en êtes face à sa cible et s'il est cadré pour réussir. Les cinq badges S·M·A·R·T signalent quoi corriger ; les habitudes liées le font avancer chaque jour.",
    bullets: [
      "Progression concrète (15/24)",
      "Badges qualité S·M·A·R·T",
      "Liés aux habitudes qui les font avancer",
    ],
    smart: ["S", "M", "A", "R", "T"],
    smartFull: ["Spécifique", "Mesurable", "Atteignable", "Réaliste", "Temporel"],
    items: [
      { t: "Lire 24 livres", cat: "Personnel", cur: 15, max: 24, unit: "livres", c: "263 70% 60%", smart: [1, 1, 1, 1, 1], linked: "Lecture" },
      { t: "Courir 50h / mois", cat: "Santé", cur: 32, max: 50, unit: "h", c: "217 91% 60%", smart: [1, 1, 1, 1, 1], linked: "Course" },
      { t: "Apprendre Rust", cat: "Apprentissage", cur: 8, max: 30, unit: "sessions", c: "20 90% 55%", smart: [1, 1, 1, 0, 1], linked: null },
    ],
  },

  health: {
    tag: "Santé & sommeil · chronotype",
    title: "Planifiez avec votre corps, pas contre lui.",
    desc: "Connectez votre montre et DPM lit le sommeil, la FC au repos, l'activité et la récupération — puis apprend votre chronotype et vous dit quand placer votre travail le plus exigeant.",
    bullets: [
      "Sommeil, FC repos, pas & récupération",
      "Apprend votre chronotype",
      "Corrélation sommeil → énergie",
    ],
    tabs: ["Vitaux", "Sommeil", "Chronotype"],
    synced: "sync il y a 4 min",
    vitals: [
      { k: "sleep", label: "Sommeil", v: "7 h 24", sub: "Bonne · +38 min", c: "263 70% 62%", icon: "Moon" },
      { k: "hr", label: "FC repos", v: "58", unit: "bpm", sub: "Stable · normal", c: "0 80% 62%", icon: "Heart" },
      { k: "steps", label: "Activité · pas", v: "6 240", sub: "62 % de l'objectif", c: "217 85% 62%", icon: "Zap" },
      { k: "recovery", label: "Récupération", v: "82", unit: "/100", sub: "Élevée · prêt", c: "142 70% 52%", icon: "Activity" },
    ],
    chronotypes: [
      { id: "lark", n: "Alouette", d: "Pic le matin, couché tôt.", hrs: "05:00 – 21:00", icon: "Sun", on: true },
      { id: "third", n: "Troisième oiseau", d: "Au mieux au milieu de la journée.", hrs: "07:00 – 23:00", icon: "Bird", on: false },
      { id: "owl", n: "Hibou", d: "Plus vif en soirée.", hrs: "10:00 – 02:00", icon: "Moon", on: false },
    ],
    ai: "Bonne récupération → placez votre tâche la plus exigeante ce matin. DPM propose un créneau optimal à ",
    aiTime: "09:00",
  },

  energy: {
    tag: "Énergie & chronotype",
    title: "Planifiez selon votre vrai rythme.",
    desc: "Notez comment vous vous sentez et DPM apprend vos pics et vos creux, puis suggère le meilleur créneau pour le deep work. Tapez un niveau pour l'entraîner.",
    bullets: [
      "Notez votre énergie en un tap",
      "Apprend votre chronotype",
      "Place le travail dur sur votre pic",
    ],
    hint: "↓ Tapez votre énergie au fil de la journée",
    times: ["8h", "10h", "12h", "14h", "16h", "18h"],
    ai: "Meilleur créneau deep-work : ",
  },

  stats2: {
    tag: "Analytics & statistiques",
    title: "Voyez précisément où part votre temps.",
    desc: "Aucune culpabilité, juste de la clarté. Temps par catégorie, heures de focus, régularité des habitudes et charge — tout est privé, jamais partagé.",
    bullets: [
      "Répartition du temps par catégorie",
      "Heures de focus & tendance deep-work",
      "Statistiques 100 % privées",
    ],
    breakdown: [
      { label: "Deep work", v: 38, c: "263 70% 60%" },
      { label: "Réunions", v: 24, c: "217 91% 60%" },
      { label: "Personnel", v: 22, c: "38 92% 55%" },
      { label: "Admin", v: 16, c: "142 70% 50%" },
    ],
    score: "Score de productivité",
    hours: "Heures de focus cette semaine",
  },

  rules: {
    tag: "Automatisation · Si… Alors…",
    title: "Votre agenda se défend tout seul.",
    desc: "Les règles ajoutent des marges, protègent le focus et insèrent vos pauses sans y penser. Partez d'un modèle, activez-le, et regardez le compteur grimper.",
    bullets: [
      "Si déclencheur → alors action",
      "Un compteur d'exécutions par règle",
      "Modèles prêts à l'emploi",
    ],
    hint: "↓ Activez ou désactivez une règle",
    items: [
      { n: "Temps de focus", d: "Protège les blocs de deep work", icon: "Shield", c: "263 70% 60%", runs: 12, on: true },
      { n: "Pause déjeuner", d: "Insère une pause déjeuner chaque jour", icon: "Coffee", c: "142 70% 50%", runs: 8, on: true },
      { n: "Marge réunion", d: "Ajoute 15 min après chaque réunion", icon: "Zap", c: "20 90% 55%", runs: 3, on: true },
      { n: "Surcharge du mardi", d: "Décale le peu prioritaire des mardis chargés", icon: "Activity", c: "0 84% 60%", runs: 0, on: false },
    ],
    runs: "exéc.",
    templates: "Modèles",
    templateChips: ["Temps de focus", "Pause déjeuner", "Marges réunion"],
  },

  spaces: {
    tag: "Espaces · une app, plusieurs contextes",
    title: "Pro, perso, études — bien séparés.",
    desc: "Un Espace cadre toute l'app — agendas, tâches, habitudes, objectifs et règles. Basculez en un clic et tout se re-teinte. Partagez un Espace avec les bonnes personnes et accordez des droits par module.",
    bullets: [
      "Cadrez tout selon un contexte",
      "Couleur d'ambiance par espace",
      "Partage & assignation granulaires",
    ],
    hint: "↓ Changez d'espace — la page se re-teinte",
    list: [
      { id: "all", n: "Tous", icon: "Layers", c: "263 70% 60%", hours: "Toutes les heures" },
      { id: "pro", n: "Professionnel", icon: "Briefcase", c: "217 91% 60%", hours: "09:00 – 17:00" },
      { id: "perso", n: "Personnel", icon: "Heart", c: "330 80% 60%", hours: "Soirs & week-ends" },
      { id: "etudes", n: "Études", icon: "GraduationCap", c: "38 92% 55%", hours: "Soirs" },
    ],
    modules: ["Agendas", "Tâches", "Priorités", "Objectifs", "Habitudes"],
    people: [
      { n: "Ralph Aubry", r: "Propriétaire", i: "RA", c: "263 70% 55%" },
      { n: "Léa Bouchard", r: "Édition", i: "LB", c: "217 91% 55%" },
      { n: "Marc Therrien", r: "Invité", i: "MT", c: "38 92% 50%" },
    ],
    members: "Partagé avec",
    invite: "Inviter",
  },

  customize: {
    tag: "À votre image",
    title: "Tout personnaliser — en direct.",
    desc: "Choisissez un accent et regardez toute l'expérience se re-thématiser instantanément. Clair ou sombre, vos couleurs par espace — accessibilité incluse.",
    bullets: [
      "Accent & thème en direct",
      "Couleur par espace & agenda",
      "Contraste WCAG-AA, toujours",
    ],
    hint: "↓ Choisissez un accent — la démo se recolore",
    accent: "Accent",
    appearance: "Aperçu",
    light: "Clair",
    dark: "Sombre",
  },
} as const;

export type ModulesCopy = typeof modulesCopy;
