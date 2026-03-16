import React, { Suspense, lazy } from 'react';

const RichTextEditorImpl = lazy(() =>
  import('./rich-text-editor').then(m => ({ default: m.RichTextEditor }))
);

interface LazyRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const LazyRichTextEditor = (props: LazyRichTextEditorProps) => (
  <Suspense
    fallback={
      <div
        className="rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse"
        style={{ minHeight: props.minHeight || '120px' }}
      >
        Loading editor...
      </div>
    }
  >
    <RichTextEditorImpl {...props} />
  </Suspense>
);
