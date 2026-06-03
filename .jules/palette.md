# Palette's Journal - Critical UX Learnings

## 2024-06-03 - [Semantic Feedback in Toast Notifications]
**Learning:** Visual feedback should provide immediate semantic context. Using a single brand color (like "Ember") for all system messages forces users to read text to distinguish between success and error states. Mapping specific icons and brand colors (Meadow for success, Coral for error, Sky for info) improves accessibility and mental processing speed for system feedback.

**Action:** Implement semantic icon/color mapping for Toast components to provide immediate visual context for different message types.

## 2024-06-03 - [Accessible Loading States in Core UI Components]
**Learning:** Adding a 'loading' state to core buttons is better for UX than just disabling them. By incorporating `aria-busy="true"` and an inline spinner within the button itself, we maintain the layout stability while giving the user clear, accessible feedback that their action is being processed.
**Action:** Use the `loading` prop on `Button` components for any asynchronous operation to ensure consistent feedback and accessibility across the application.
