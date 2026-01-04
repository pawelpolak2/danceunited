# Style Guide

## Default Styling Rules

### Text Elements
- **All text should be shiny/metallic by default** - Use `ShinyText` component for all text content
- **Titles**: Use `ShinyText` with `variant="title"` (automatically lowercases text)
- **Body text**: Use `ShinyText` with `variant="body"`
- **Form labels**: Automatically use `ShinyText` via `FormField` component
- **Error messages**: Automatically use `ShinyText` via `FormError` component

### Buttons
- **All buttons should use `MetallicButton` or `MetallicLink` components**
- **Default style**: Black fill, gold metallic text, gold shiny border
- Add `border-2` class to enable the gold border effect

### Color Scheme
- **Background**: `bg-gray-950` (dark grayish-black)
- **Text**: Gold metallic (`#ffd700` with metallic gradient animation)
- **Borders**: Gold metallic with animated shine

### Fonts
- **Titles**: `Cinzel` (serif)
- **Body**: `EB Garamond` (serif)

## Component Guidelines

When creating new components:
1. **Always use `ShinyText` for text content** - don't use plain `<p>`, `<span>`, `<h1>`, etc.
2. **Use `MetallicButton` or `MetallicLink` for interactive elements**
3. **Apply `border-2` to buttons for the gold border effect**
4. **Follow the gold-on-black color scheme**

## Examples

```tsx
// ✅ Good - Using ShinyText
<ShinyText variant="title" className="text-2xl">page title</ShinyText>
<ShinyText variant="body">Body text content</ShinyText>

// ❌ Bad - Plain text elements
<h1>Page Title</h1>
<p>Body text content</p>

// ✅ Good - Using MetallicButton with border
<MetallicButton className="border-2">Click me</MetallicButton>

// ❌ Bad - Plain button
<button>Click me</button>
```

