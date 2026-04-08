"use client";
import { useMemo } from "react";

/**
 * useAdaptiveUI — Computes UI complexity from neural state
 *
 * The UI adapts based on:
 * 1. Brain state (optimal/functional/stressed/critical)
 * 2. Burnout risk level
 * 3. Session activity (active sessions get minimal chrome)
 *
 * Returns:
 * - complexity: "full" | "standard" | "reduced" | "minimal"
 * - showScience: boolean (show neuroscience explanations)
 * - showDetails: boolean (show expandable details)
 * - showMetrics: boolean (show anti-cheat metrics)
 * - showPreview: boolean (show next phase preview)
 * - animationLevel: "full" | "reduced" | "none"
 * - feedbackIntensity: 0-1 (haptic/visual feedback strength)
 */
export function useAdaptiveUI(brainState, burnoutRisk, isActive) {
  return useMemo(() => {
    const state = brainState || "functional";
    const isCritical = state === "critical";
    const isStressed = state === "stressed";
    const isOptimal = state === "optimal";
    const highBurnout = burnoutRisk === "alto" || burnoutRisk === "crítico";

    // Determine complexity level
    let complexity = "full";
    if (highBurnout) complexity = "minimal";
    else if (isCritical) complexity = "reduced";
    else if (isStressed) complexity = "standard";

    // During active session, always reduce chrome
    if (isActive && complexity === "full") complexity = "standard";

    return {
      complexity,
      showScience: complexity === "full" || complexity === "standard",
      showDetails: complexity !== "minimal",
      showMetrics: complexity !== "minimal",
      showPreview: complexity !== "minimal",
      animationLevel: highBurnout ? "none" : isCritical ? "reduced" : "full",
      feedbackIntensity: isOptimal ? 0.6 : isStressed ? 0.9 : isCritical ? 1.0 : 0.7,
      // UI state labels for components
      uiState: isCritical ? "critical"
        : isStressed ? "alert"
        : isOptimal ? "flow"
        : "standard",
    };
  }, [brainState, burnoutRisk, isActive]);
}
