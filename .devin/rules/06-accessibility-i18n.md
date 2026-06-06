---
trigger: always_on
---
# 06 — Accessibility and Internationalization

## Accessibility (WCAG 2.1 AA)

All UI components must meet WCAG 2.1 AA standards:

- Screen Reader bridge for NVDA, JAWS, VoiceOver
- Focus Manager for keyboard navigation
- ARIA Live Region Manager for dynamic content
- Keyboard Navigation Tree for panel focus cycling
- Theme Contrast Checker for color compliance
- Monaco editor accessibility API integration
- Panel open/close screen reader announcements
- Terminal output screen reader compatibility
- Agent messages and diff preview accessibility
- Form and input field label/ARIA support
- Motion reduction support for users with vestibular disorders

## Internationalization (i18n)

All user-facing strings must support multiple languages:

- Message key-value system for UI strings
- Message Registry for centralized string management
- Locale Loader for dynamic language switching
- Fallback Chain Handler for missing translations
- RTL Layout Adapter for right-to-left languages
- Format Provider for date, number, currency formatting
- Agent messages and prompts must support i18n
- Settings UI for language selection
- Initial language packages: EN, TR, ES, FR, DE, JA, ZH

## Required Behavior

- Do not hardcode user-facing strings
- Use message keys instead of literal text in UI components
- Ensure all new UI components have ARIA labels and roles
- Test keyboard navigation for all interactive elements
- Verify color contrast ratios meet WCAG AA standards
