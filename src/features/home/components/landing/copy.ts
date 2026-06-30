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
    queue: "File de session",
    hyperfocus: "Hyperfocus",
    breakLabel: "Pause",
    skip: "Passer la pause",
    lockedNote: "Verrouillé — mettez en pause pour changer",
    demoBadge: "Vitesse démo",
    min: "min",
    label: "Focus",
    start: "Démarrer",
    pause: "Pause",
    reset: "Reset",
    session: "Session",
  },

  music: {
    label: "Musique de focus",
    connect: "Connecter",
    friendly: "Propice au focus",
    nowPlaying: "En lecture",
    muteBreak: "Couper en pause",
    mutedNow: "Coupé pendant la pause",
    activeNow: "actif",
    track: "Nappe ambiante",
    services: ["Spotify", "Apple Music", "YouTube Music"],
    playlists: [
      { n: "Deep Work", c: 64, score: 92, ha: 217, hb: 190 },
      { n: "Lofi Chill", c: 120, score: 85, ha: 263, hb: 305 },
      { n: "Piano & pluie", c: 72, score: 78, ha: 228, hb: 262 },
      { n: "Titres likés", c: 248, score: 44, ha: 330, hb: 280 },
    ],
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
    seeSlot: "Voir le créneau",
    sleepStats: [
      ["Durée moyenne", "7 h 18", "rec. 7–9 h"],
      ["Régularité ±", "24 min", "régulier"],
      ["Qualité", "Bonne", "73 %"],
    ],
    sleepNote: "7 dernières nuits · durée + qualité",
    sync: {
      label: "Synchronisez vos données santé",
      now: "Synchroniser",
      just: "synchronisé à l'instant",
      auto: "Sync auto depuis votre téléphone — Apple Santé ou Android",
    },
    sources: [
      { n: "Apple Santé", c: "0 0% 82%", on: true },
      { n: "Google Fit", c: "142 70% 48%", on: false },
      { n: "Samsung Health", c: "217 85% 55%", on: false },
      { n: "Apple Watch", c: "0 0% 82%", on: true },
      { n: "Oura Ring", c: "263 70% 60%", on: false },
    ],
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
    union: "union",
    scoped: "éléments cadrés",
    levels: ["Aucun", "Vue", "Édition"],
    permsFor: "Accès de",
    tapHint: "Touchez une personne, puis réglez son accès par module",
    counts: { all: 24, pro: 9, perso: 11, etudes: 5 } as Record<string, number>,
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

  ai: {
    tag: "IA contextuelle",
    title: "Un planificateur qui réfléchit avec vous.",
    desc: "DPM lit votre semaine, votre énergie et vos priorités, puis propose une action à accepter en un clic.",
    suggestion: "Déplacer « Relire la PR » à 09:30 — votre pic d'énergie du matin.",
    accept: "Accepter",
    dismiss: "Plus tard",
    thinking: "Réflexion…",
    applied: "Appliqué ✓",
  },

  resources: {
    tag: "Ressources & tutoriels",
    title: "Jamais bloqué longtemps.",
    desc: "Des tutoriels vidéo courts, des visites guidées et un centre d'aide cherchable — en français et en anglais. Un souci ? La solution en quelques secondes.",
    bullets: [
      "Tutoriels vidéo par module",
      "Visites guidées interactives",
      "Centre d'aide bilingue (FR / EN)",
    ],
    videos: [
      { t: "Bien démarrer en 3 min", len: "3:12", tag: "Visite" },
      { t: "Maîtriser le glisser-déposer", len: "4:48", tag: "Agenda" },
      { t: "Construire une habitude qui tient", len: "2:30", tag: "Habitudes" },
    ],
    watch: "Regarder",
  },

  reviews: {
    label: "Adoré par les gens occupés",
    title: "De vrais utilisateurs, de vraies routines.",
    sub: "Des avis du terrain — avec l'astuce que chacun jure d'utiliser.",
    items: [
      { name: "Sofia R.", role: "Fondatrice de startup", icon: "Briefcase", stars: 5, text: "Le moteur de règles à lui seul m'a rendu mes matins — les marges entre réunions sont automatiques.", tip: "Commencez par le modèle « Marge réunion »." },
      { name: "Marcus L.", role: "Étudiant ingénieur", icon: "GraduationCap", stars: 5, text: "Le rituel de planification est la seule chose qui a survécu aux examens. Deux minutes, réglé.", tip: "Estimez honnêtement — l'agenda se remplit seul." },
      { name: "Alex P.", role: "Freelance", icon: "Compass", stars: 5, text: "Les Espaces séparent clients et vie perso sans deux apps. Partager un créneau conclut plus vite.", tip: "Un Espace par client, partagé en lecture." },
      { name: "Priya K.", role: "Team lead", icon: "Users", stars: 4, text: "Santé + chronotype ont changé ma façon de placer le deep work — mes 1-1 ne mangent plus mon focus.", tip: "Connectez votre montre pour la courbe d'énergie." },
    ],
  },

  security: {
    tag: "Sécurité & confidentialité",
    title: "Vos données, votre temps.",
    desc: "Chiffrement de bout en bout pour les données sensibles. Conforme RGPD, SOC2 en cours. Exportez ou supprimez tout en un clic, à tout moment.",
    badges: ["Conforme RGPD", "SOC2 en cours", "Chiffrement AES-256"],
    cards: [
      { t: "Export en 1 clic", d: "JSON · ICS · CSV" },
      { t: "Sans publicité", d: "Zéro tracking tiers" },
      { t: "Suppression totale", d: "Effacé sous 24 h" },
      { t: "Journal d'audit", d: "Chaque action tracée" },
    ],
  },

  socialProof: {
    label: "Adopté par les gens occupés, partout",
    rating: "Note moyenne 4,9/5",
    users: "12 000+ semaines planifiées",
    ph: "Produit du jour n°1",
  },

  pricing: {
    label: "Tarifs",
    title: "Une tarification simple qui grandit avec vous.",
    sub: "Commencez gratuitement, passez au niveau supérieur quand ça vaut le coup. Chaque offre inclut l'espace de travail complet.",
    monthly: "Mensuel",
    yearly: "Annuel",
    save: "−20 %",
    perMonth: "/mois",
    billedYearly: "facturé annuellement",
    forever: "gratuit à vie",
    popular: "Le plus choisi",
    cta: "Commencer gratuitement",
    ctaPro: "Essai 14 jours",
    ctaTeam: "Choisir Équipe",
    perSeat: "par personne",
    plans: [
      {
        id: "free",
        name: "Gratuit",
        priceM: 0,
        priceY: 0,
        tagline: "Pour s'organiser.",
        features: ["1 agenda connecté", "Tâches, habitudes & objectifs", "Rituel de planification", "Statistiques 7 jours", "Mobile & web"],
      },
      {
        id: "pro",
        name: "Pro",
        priceM: 12,
        priceY: 9,
        tagline: "Pour reprendre votre temps.",
        features: ["Agendas illimités", "Planification par IA", "Focus & Pomodoro Pro", "Énergie & chronotype", "Statistiques illimitées", "Règles & automatisations"],
      },
      {
        id: "team",
        name: "Équipe",
        priceM: 25,
        priceY: 20,
        tagline: "Pour planifier ensemble.",
        features: ["Tout le plan Pro", "Espaces & agendas partagés", "Disponibilités d'équipe", "Rôles & permissions", "Support prioritaire", "Admin & journal d'audit"],
      },
    ],
  },

  faq: {
    label: "FAQ",
    title: "Vos questions, nos réponses.",
    sub: "Tout ce qu'il faut savoir avant de commencer. Une autre question ? L'équipe répond dans l'app.",
    items: [
      { q: "Mes données sont-elles sécurisées et privées ?", a: "Oui. Les données sensibles sont chiffrées en AES-256, aucun tracking publicitaire tiers, et vos statistiques ne sont jamais partagées. Nous sommes conformes RGPD et SOC2 est en cours." },
      { q: "Puis-je résilier à tout moment ?", a: "Toujours, en un clic depuis les réglages — sans email ni appel. Vous gardez l'accès jusqu'à la fin de la période payée, et le plan Gratuit reste gratuit à vie." },
      { q: "Puis-je migrer depuis Google Agenda ou Notion ?", a: "Oui. La synchro bidirectionnelle connecte Google, Outlook et Apple en quelques secondes, et vous importez vos tâches depuis Notion, Todoist et CSV. Rien n'est verrouillé." },
      { q: "Y a-t-il un essai gratuit ?", a: "Pro et Équipe incluent un essai de 14 jours sans carte bancaire. Si vous ne faites rien, vous basculez simplement sur le plan Gratuit — jamais de prélèvement surprise." },
      { q: "Que deviennent mes données si je pars ?", a: "Exportez tout (JSON, ICS, CSV) en un clic, à tout moment. Demandez la suppression et votre compte et vos données sont effacés sous 24 h." },
      { q: "Le français et l'anglais sont-ils pris en charge ?", a: "Entièrement. Toute l'app, le centre d'aide et les tutoriels sont bilingues — changez de langue quand vous voulez, tout suit instantanément." },
      { q: "Quels appareils et intégrations sont pris en charge ?", a: "Web et mobile, plus les agendas Google, Outlook et Apple, Todoist, Slack, Notion et Zoom. De nouvelles intégrations arrivent régulièrement." },
      { q: "Faut-il une carte bancaire pour commencer ?", a: "Non. Créez votre compte et utilisez le plan Gratuit sans carte. Ajoutez un moyen de paiement uniquement si vous décidez de passer à un plan supérieur." },
    ],
  },

  finalCta: {
    title: "Reprenez votre temps.",
    sub: "Inscription en 30 secondes. Annulable en un clic.",
    button: "Créer mon compte",
    reassure: "Plan gratuit à vie · Sans carte bancaire",
  },

  footer: {
    tagline: "Votre temps mérite mieux.",
    rights: "© 2026 DPM Elevate. Tous droits réservés.",
    cols: [
      { t: "Produit", l: ["Fonctionnalités", "Modules", "Tarifs", "Roadmap"] },
      { t: "Ressources", l: ["Centre d'aide", "Tutoriels", "Guides", "Nouveautés"] },
      { t: "Légal", l: ["Conditions", "Confidentialité", "Cookies", "RGPD"] },
    ],
  },

  // Hero live calendar demo
  calendar: {
    days: ["Lun", "Mar", "Mer", "Jeu", "Ven"],
    views: { day: "Jour", week: "Semaine", month: "Mois" },
    events: ["Point d'équipe", "Deep work", "Revue design", "Déjeuner", "Revue de sprint"],
    today: "Aujourd'hui",
    monthLabel: "Mai 2026",
  },

  tasks: {
    done: "faites aujourd'hui",
  },

  // Stat band (count-up)
  stats: {
    label: "Pourquoi ils basculent",
    items: [
      { v: 11, suffix: "h", t: "économisées / semaine", d: "Moins d'organisation, plus d'action." },
      { v: 9, suffix: "", t: "modules, un seul endroit", d: "De l'agenda aux objectifs, sans second onglet." },
      { v: 92, suffix: "%", t: "gardent leur série", d: "Des habitudes qui tiennent après la 2ᵉ semaine." },
    ],
  },

  heroStage: {
    liveBadge: "Aperçu en direct — glissez, cliquez, complétez",
    integrates: "Se synchronise avec",
  },
} as const;

export type ModulesCopy = typeof modulesCopy;
