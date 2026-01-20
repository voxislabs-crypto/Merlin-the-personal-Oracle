// Example of how to use Builder.io for dynamic content
'use client';

import { useEffect, useState } from 'react';
import { Builder, BuilderComponent } from '@builder.io/react';

// Builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

export default function DynamicHeroSection() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    // Builder.get('hero-section', {
    //   userAttributes: {
    //     urlPath: window.location.pathname
    //   }
    // }).promise().then(setContent);
  }, []);

  return (
    <div>
      {content ? (
        <BuilderComponent model="hero-section" content={content} />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4 text-amber-400">Merlin</h1>
            <p className="text-xl mb-4">Loading dynamic content...</p>
          </div>
        </div>
      )}
    </div>
  );
}