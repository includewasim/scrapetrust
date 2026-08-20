// Each scenario sends a deliberately-crafted heal prompt designed to produce
// a diff that should be judged a specific way. expectedVerdict encodes our
// ground truth for measuring the risk-gate's accuracy.
export interface ChaosScenario {
  id: string;
  description: string;
  healPrompt: string;
  expectedVerdict: "safe_to_promote" | "needs_review" | "reject";
}

export const chaosScenarios: ChaosScenario[] = [
  {
    id: "benign-rename",
    description: "Ask for a harmless code cleanup that should preserve meaning",
    healPrompt:
      "Refactor the parser code to use more descriptive variable names, but do not change what data is extracted or how fields are computed.",
    expectedVerdict: "safe_to_promote",
  },
  {
    id: "wrong-field-price-swap",
    description: "Ask the AI to extract a different, semantically-wrong field as if it were price",
    healPrompt:
      "The price field seems broken. Instead of the current price, extract the book's star rating value (found in the p.star-rating class name, e.g. 'Three', 'Four') and put it in the price field as a number, since that might be what's actually needed.",
    expectedVerdict: "reject",
  },
  {
    id: "empty-field-drop",
    description: "Ask the AI to stop extracting a field entirely, simulating a page redesign that removed it",
    healPrompt:
      "The inStock field is causing errors, please remove it from the extraction entirely and don't include it in the output.",
    expectedVerdict: "reject",
  },
  {
    id: "currency-format-change",
    description: "Ask for a currency format change that preserves meaning",
    healPrompt:
      "Change the currency output from a 3-letter code to the raw currency symbol character instead, keeping the same underlying value.",
    expectedVerdict: "safe_to_promote",
  },
];

// Note: rowCountAfter in HealEvent records now reflects sampleAfter.length,
// which is a preview sample size, not a true row count — the risk-gate prompt
// is explicitly told not to treat this as a data-loss signal.
