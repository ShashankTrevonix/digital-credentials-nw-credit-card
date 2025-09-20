# Image Assets

## Available Images

✅ **Blueberry1.png** - Background image for "money" and "confident" text highlights

## Image Specifications

- **Format**: PNG
- **Source**: [NatWest Official Website](https://www.natwest.com/etc.clientlibs/responsive/editable/components/foundation/title/clientlibs/clientlib_title_base/resources/images/Blueberry1.png)
- **Usage**: Background image for text spans
- **Path**: `/clientlib_title_base/resources/images/Blueberry1.png`
- **Status**: ✅ Downloaded and ready to use

## Implementation

The text spans are styled with:
```css
.text-highlight-image {
  background-image: url('/clientlib_title_base/resources/images/Blueberry1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 2.5rem;
  display: inline-flex;
  align-items: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  font-weight: 700;
  letter-spacing: 0.025em;
  transition: all 0.3s ease;
}
```

## Features

- **Hover Effect**: Subtle scale animation on hover
- **Text Shadow**: Enhanced readability
- **Responsive**: Works on all screen sizes
- **Fallback**: Blue gradient if image fails to load
