/**
 * SMART Goals Validation
 *
 * S - Specific: Clear and well-defined
 * M - Measurable: Quantifiable with numbers/metrics
 * A - Achievable: Realistic given constraints
 * R - Relevant: Aligned with broader objectives
 * T - Time-bound: Has a deadline
 */

export interface SMARTCriteria {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
}

export interface SMARTValidationResult {
  isValid: boolean;
  score: number; // 0-100
  criteria: SMARTCriteria;
  suggestions: string[];
}

export interface GoalInput {
  title: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
}

/**
 * Validates a goal against SMART criteria
 */
export function validateSMARTGoal(goal: GoalInput): SMARTValidationResult {
  const suggestions: string[] = [];

  // S - Specific: Title should be descriptive (>10 chars) and have description
  const specific =
    goal.title.length >= 10 &&
    (goal.description?.length ?? 0) >= 20;

  if (!specific) {
    if (goal.title.length < 10) {
      suggestions.push("Rendez le titre plus descriptif (au moins 10 caractères)");
    }
    if ((goal.description?.length ?? 0) < 20) {
      suggestions.push("Ajoutez une description détaillée de votre objectif");
    }
  }

  // M - Measurable: Has a numeric target and unit
  const measurable =
    goal.targetValue !== undefined &&
    goal.targetValue > 0 &&
    (goal.unit?.length ?? 0) > 0;

  if (!measurable) {
    if (!goal.targetValue || goal.targetValue <= 0) {
      suggestions.push("Définissez un objectif chiffré (ex: 10, 50, 100)");
    }
    if (!goal.unit) {
      suggestions.push("Précisez l'unité de mesure (ex: livres, km, heures)");
    }
  }

  // A - Achievable: Target is reasonable (not 0, not astronomically high)
  // This is a heuristic - real achievability depends on context
  const achievable =
    goal.targetValue !== undefined &&
    goal.targetValue >= 1 &&
    goal.targetValue <= 10000;

  if (!achievable) {
    suggestions.push("Vérifiez que l'objectif est réaliste et atteignable");
  }

  // R - Relevant: Has a category (indicates it's connected to a life area)
  const relevant = (goal.category?.length ?? 0) > 0;

  if (!relevant) {
    suggestions.push("Choisissez une catégorie pour relier l'objectif à un domaine de vie");
  }

  // T - Time-bound: Has both start and end dates
  const timeBound =
    goal.startDate !== undefined &&
    goal.endDate !== undefined &&
    goal.endDate > goal.startDate;

  if (!timeBound) {
    if (!goal.startDate) {
      suggestions.push("Définissez une date de début");
    }
    if (!goal.endDate) {
      suggestions.push("Définissez une date limite");
    }
    if (goal.startDate && goal.endDate && goal.endDate <= goal.startDate) {
      suggestions.push("La date de fin doit être après la date de début");
    }
  }

  const criteria: SMARTCriteria = {
    specific,
    measurable,
    achievable,
    relevant,
    timeBound,
  };

  const metCriteria = Object.values(criteria).filter(Boolean).length;
  const score = Math.round((metCriteria / 5) * 100);
  const isValid = metCriteria === 5;

  return {
    isValid,
    score,
    criteria,
    suggestions,
  };
}

/**
 * Get label for SMART criteria
 */
export function getSMARTLabel(key: keyof SMARTCriteria): {
  letter: string;
  name: string;
  description: string;
} {
  const labels: Record<keyof SMARTCriteria, { letter: string; name: string; description: string }> = {
    specific: {
      letter: "S",
      name: "Spécifique",
      description: "L'objectif est clair et bien défini",
    },
    measurable: {
      letter: "M",
      name: "Mesurable",
      description: "L'objectif a un indicateur chiffré",
    },
    achievable: {
      letter: "A",
      name: "Atteignable",
      description: "L'objectif est réaliste",
    },
    relevant: {
      letter: "R",
      name: "Pertinent",
      description: "L'objectif est aligné avec vos priorités",
    },
    timeBound: {
      letter: "T",
      name: "Temporel",
      description: "L'objectif a une échéance définie",
    },
  };

  return labels[key];
}

/**
 * SMART goal templates for common goal types
 */
export const SMART_TEMPLATES = [
  {
    category: "Santé",
    title: "Courir [X] km par semaine pendant [Y] semaines",
    example: "Courir 15 km par semaine pendant 12 semaines",
    targetValue: 15,
    unit: "km/semaine",
  },
  {
    category: "Apprentissage",
    title: "Lire [X] livres en [Y] mois",
    example: "Lire 12 livres en 6 mois",
    targetValue: 12,
    unit: "livres",
  },
  {
    category: "Finance",
    title: "Économiser [X] € en [Y] mois",
    example: "Économiser 3000€ en 6 mois",
    targetValue: 3000,
    unit: "euros",
  },
  {
    category: "Carrière",
    title: "Compléter [X] certifications en [Y] mois",
    example: "Obtenir 2 certifications AWS en 3 mois",
    targetValue: 2,
    unit: "certifications",
  },
  {
    category: "Personnel",
    title: "Méditer [X] minutes par jour pendant [Y] jours",
    example: "Méditer 10 minutes par jour pendant 30 jours",
    targetValue: 30,
    unit: "jours",
  },
];
