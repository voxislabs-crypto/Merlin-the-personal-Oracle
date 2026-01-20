import { Builder, BuilderComponent } from '@builder.io/react';

// Builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

export default function BuilderPage({ content }: { content: any }) {
  return <BuilderComponent model="page" content={content} />;
}