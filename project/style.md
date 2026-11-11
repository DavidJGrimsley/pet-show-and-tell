# Pet Show and Tell Style

## Visual Direction
Friendly, calm, and photo-forward. The app should feel welcoming to pet owners and keep each pet photo as the main focus. Prefer clear, uncluttered screens that work comfortably on a small Android phone.

## Brand and References
- Product language: safe place, enjoy pictures, share pet moments.
- The read-only IDE prototype folder is a workflow reference, not a visual reference for the pet app.
- No app-specific screenshots or brand assets have been supplied yet. Align the final styling to screenshots when available.

## Colors
- Use warm off-white backgrounds and quiet neutral surfaces.
- Use a calm green or teal as the main action color, with a warm coral accent for Love.
- Keep text dark and high contrast; never place text directly over busy images without a scrim.
- Keep color tokens in project/theme.json and provide readable light-mode surfaces.

## Typography
- Use the platform system font.
- Use a clear heading hierarchy and comfortable body text.
- Keep pet names prominent and descriptions readable; timestamps and secondary labels may be smaller but remain legible.

## Layout and Spacing
- Give photos generous space and use consistent rounded card corners.
- Use a single-column feed sized for phones.
- Keep primary actions reachable and visually distinct.
- Keep forms short, label fields clearly, and show validation beside the relevant field.

## Motion Tone
Subtle and cheerful. Use brief pressed-state feedback for cards and reaction buttons. Avoid motion that competes with the pet photos.

## Accessibility Notes
- Use readable contrast, scalable type, accessible labels for Like and Love, and visible selected states.
- Keep touch targets comfortable and ensure onboarding can be completed with screen-reader labels.
- Provide a sample-image path when photo-library permission is unavailable.

## Style Questions to Revisit
- Confirm exact palette and imagery after product-specific screenshots or pet photos are available.

<!-- MDS_STYLIST_THEME_START -->
## Canonical Theme Tokens

The editable source is project/theme.json. Use MDS Stylist sync to change tokens, then update this summary to match.

- Light background: warm off-white `#f7f5ef`; surface: pale green `#e5eee3`.
- Primary: calm green `#386c54`; secondary/Love: coral `#ce7a67`.
- Text: deep green charcoal `#263d32`.
- Dark mode uses forest background `#1e2b23`, sage primary `#91b99b`, coral `#e29683`, and warm white text `#f5f2e9`.
<!-- MDS_STYLIST_THEME_END -->
