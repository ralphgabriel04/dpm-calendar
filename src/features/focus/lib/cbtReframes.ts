/**
 * CBT Reframe Library (Ticket #140)
 *
 * When the anti-procrastination engine detects an avoidance pattern,
 * we surface a cognitive-behavioral reframe drawn from this library.
 * Each detection type maps to multiple templates — we pick one at random
 * so the prompts don't feel stale.
 */

export type CbtDetectionType =
  | "perfectionism"
  | "overwhelm"
  | "avoidance"
  | "fear_of_failure"
  | "generic";

export interface CbtReframe {
  detectionType: CbtDetectionType;
  /** Short name of the cognitive distortion being reframed. */
  distortion: string;
  /** A short prompt that reframes the thought. */
  reframe: string;
  /** A tiny actionable step the user can take right now. */
  microAction: string;
}

export const CBT_REFRAMES: CbtReframe[] = [
  // --- Perfectionism (5) ---
  {
    detectionType: "perfectionism",
    distortion: "All-or-nothing thinking",
    reframe:
      "A rough draft is still progress. Done imperfectly beats perfect-and-unstarted every time.",
    microAction: "Write the worst possible first sentence. You can fix it later.",
  },
  {
    detectionType: "perfectionism",
    distortion: "Unrealistic standards",
    reframe:
      "You're comparing your first attempt to someone else's final version. Give yourself permission to be a beginner.",
    microAction: "Set a 10-minute timer and commit to producing a messy v0.",
  },
  {
    detectionType: "perfectionism",
    distortion: "Polish-before-progress",
    reframe:
      "Perfectionism is procrastination in a tuxedo. Ship the ugly version first.",
    microAction: "Save the file as 'draft_v0_ugly' and start typing.",
  },
  {
    detectionType: "perfectionism",
    distortion: "Binary thinking",
    reframe:
      "80% done today is infinitely more valuable than 100% done next month.",
    microAction: "Write down what 'good enough' looks like, then stop when you hit it.",
  },
  {
    detectionType: "perfectionism",
    distortion: "Critic's voice",
    reframe:
      "The inner critic gets quieter when you produce something — anything — to critique.",
    microAction: "Produce one concrete artifact in the next 15 minutes.",
  },

  // --- Overwhelm (4) ---
  {
    detectionType: "overwhelm",
    distortion: "Catastrophizing scope",
    reframe:
      "You don't have to finish it — you just have to start the smallest possible piece.",
    microAction: "List the next 3 micro-steps (under 5 minutes each).",
  },
  {
    detectionType: "overwhelm",
    distortion: "Treating a mountain as one climb",
    reframe:
      "Big tasks feel impossible because your brain is trying to do them all at once. Pick one 5-minute piece.",
    microAction: "Identify the next physical action (open doc, send email).",
  },
  {
    detectionType: "overwhelm",
    distortion: "Mental overload",
    reframe:
      "Your working memory is full. Dump everything to paper — it will feel 40% lighter.",
    microAction: "Brain-dump every related thought on paper for 3 minutes.",
  },
  {
    detectionType: "overwhelm",
    distortion: "Everything is urgent",
    reframe:
      "Not everything on your list is equally important. Focus on one thing until it's done.",
    microAction: "Circle the ONE task that matters most today and ignore the rest.",
  },

  // --- Avoidance (4) ---
  {
    detectionType: "avoidance",
    distortion: "Emotional avoidance",
    reframe:
      "The discomfort of starting is usually worse than the discomfort of doing. Starting is the hardest part.",
    microAction: "Commit to just 2 minutes. You can stop after that if you want.",
  },
  {
    detectionType: "avoidance",
    distortion: "Future-self optimism",
    reframe:
      "Future-you is not magically more motivated. Present-you has to do the starting.",
    microAction: "Start the timer before you feel ready.",
  },
  {
    detectionType: "avoidance",
    distortion: "Task aversion",
    reframe:
      "Boring tasks don't become more interesting by being postponed — they just become urgent AND boring.",
    microAction: "Do the boring task first, then reward yourself with something you enjoy.",
  },
  {
    detectionType: "avoidance",
    distortion: "Distraction loop",
    reframe:
      "Every tab you open is a vote against the thing that matters. Close them.",
    microAction: "Close every tab except the one you need, then start.",
  },

  // --- Fear of failure (3) ---
  {
    detectionType: "fear_of_failure",
    distortion: "Fortune-telling",
    reframe:
      "You can't know the outcome without starting. Evidence beats predictions.",
    microAction: "Run the experiment — even a failed attempt teaches you.",
  },
  {
    detectionType: "fear_of_failure",
    distortion: "Identity-level stakes",
    reframe:
      "This task doesn't define you. It's one attempt in a long series of attempts.",
    microAction: "Detach outcome from self-worth: just do the next action.",
  },
  {
    detectionType: "fear_of_failure",
    distortion: "Mind-reading judgment",
    reframe:
      "Most people are too busy worrying about themselves to judge your work harshly.",
    microAction: "Submit the draft even if it's imperfect — feedback is data.",
  },

  // --- Generic (2) ---
  {
    detectionType: "generic",
    distortion: "Stuck-in-thought",
    reframe:
      "You can't think your way out of this — you have to act your way out.",
    microAction: "Do one 5-minute action, then reassess.",
  },
  {
    detectionType: "generic",
    distortion: "Momentum gap",
    reframe:
      "Motivation follows action, not the other way around. Start small, momentum will build.",
    microAction: "Commit to 2 minutes. That's it.",
  },
];

/**
 * Pick a reframe for the given detection type. Falls back to generic
 * if the type is unknown or has no entries.
 */
export function pickReframe(
  detectionType: CbtDetectionType | string
): CbtReframe {
  const pool = CBT_REFRAMES.filter((r) => r.detectionType === detectionType);
  const list = pool.length > 0 ? pool : CBT_REFRAMES.filter((r) => r.detectionType === "generic");
  const idx = Math.floor(Math.random() * list.length);
  return list[idx] ?? CBT_REFRAMES[CBT_REFRAMES.length - 1];
}

/**
 * Heuristically infer a detection type from a free-text avoidance reason.
 * Used to bridge existing reportAvoidance `reason` strings to our new
 * reframe categories.
 */
export function inferDetectionType(
  reason: string | null | undefined
): CbtDetectionType {
  if (!reason) return "avoidance";
  const r = reason.toLowerCase();
  if (/\b(perfect|parfait|not good enough|assez bien)\b/.test(r)) return "perfectionism";
  if (/\b(overwhelm|too much|trop|depass|debord)\b/.test(r)) return "overwhelm";
  if (/\b(fail|echou|peur|afraid|scared|fear)\b/.test(r)) return "fear_of_failure";
  if (/\b(avoid|evit|later|plus tard|dont want|pas envie)\b/.test(r)) return "avoidance";
  return "generic";
}
