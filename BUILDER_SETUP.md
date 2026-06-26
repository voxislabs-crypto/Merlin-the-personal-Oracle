# Builder.io Integration Guide

## Setup Instructions

1. **Create a Builder.io Account**
   - Go to [builder.io](https://builder.io) and sign up
   - Create a new space for your project

2. **Get Your API Key**
   - In your Builder.io dashboard, go to Account Settings → API Keys
   - Copy your Public API Key

3. **Add Environment Variable**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_BUILDER_API_KEY=your_api_key_here
   ```

4. **Create Content in Builder.io**
   - Create a new model called "hero-section"
   - Design your landing page visually
   - Publish the content

5. **Use in Your App**
   ```tsx
   import DynamicHeroSection from '@/components/DynamicHeroSection';

   export default function Home() {
     return <DynamicHeroSection />;
   }
   ```

## Benefits of Builder.io

- **Visual Editing**: Non-technical team members can edit content
- **A/B Testing**: Test different versions of your pages
- **Personalization**: Show different content based on user attributes
- **CMS Integration**: Manage content without code changes
- **Fast Loading**: Content is cached and served from CDN

## Current Integration

The app now has Builder.io components ready. You can:

1. Replace the current landing page with a Builder.io version
2. Add dynamic sections to existing pages
3. Create landing page variations for A/B testing
4. Allow content editors to update text/images without developer intervention

Would you like me to help you set up a specific page or section with Builder.io?