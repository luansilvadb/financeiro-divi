# Palette's Journal - Critical UX Learnings

## 2024-06-03 - [Semantic Feedback in Toast Notifications]
**Learning:** Visual feedback should provide immediate semantic context. Using a single brand color (like "Ember") for all system messages forces users to read text to distinguish between success and error states. Mapping specific icons and brand colors (Meadow for success, Coral for error, Sky for info) improves accessibility and mental processing speed for system feedback.

**Action:** Implement semantic icon/color mapping for Toast components to provide immediate visual context for different message types.

## 2024-06-03 - [Unified Loading Pattern for Buttons]
**Learning:** Providing consistent visual feedback for asynchronous actions prevents "double-click" errors and reduces user anxiety. In a high-fidelity Pixar-style UI, a simple text change is insufficient; an animated spinner that preserves button dimensions maintains visual stability.
**Action:** Use the `loading` prop on the base `Button` component for all async operations to automatically handle disabled states, ARIA-busy attributes, and centered spinners.

## 2024-06-04 - [Accessible Input Limits]
**Learning:** Adding a `maxlength` constraint without a visual and accessible counter creates a confusing experience for users when their typing suddenly stops. Combining `maxlength` with an `aria-live="polite"` counter and a descriptive `aria-label` ensures both visual and screen-reader users understand input limitations without disruption.
**Action:** Always pair character limits (`maxlength`) with a live-region counter and clear ARIA labeling for the input field.
