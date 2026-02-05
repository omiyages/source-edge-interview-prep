// ABOUTME: Rich text editor component using ReactQuill for formatted text input
// ABOUTME: Provides toolbar for formatting options and maintains consistent styling with image paste support

import React, { useRef, useCallback, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  enableImagePaste?: boolean;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link', 'image'
];

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder, 
  className,
  enableImagePaste = false 
}: RichTextEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      // Validate file type and size before upload
      const allowedTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/gif'
      ]);
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.has(file.type) || file.type === 'image/svg+xml') {
        toast({
          title: "Unsupported file type",
          description: "Please upload PNG, JPG, WEBP, or GIF images.",
          variant: "destructive",
        });
        return null;
      }

      if (file.size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: "Please upload images up to 5MB.",
          variant: "destructive",
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `question-images/${fileName}`;

      setIsUploading(true);
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({
          title: "Upload Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      const { data } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);
  
  React.useEffect(() => {
    return () => {
      setIsUploading(false);
    };
  }, []);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (!enableImagePaste) return;

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (imageItem) {
      event.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      toast({
        title: "Uploading Image",
        description: "Please wait while your image is being uploaded...",
      });

      const imageUrl = await uploadImage(file);
      if (imageUrl && quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', imageUrl);
      }
      setIsUploading(false);
    }
  }, [enableImagePaste, uploadImage, toast]);

  const imageHandler = useCallback(async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      toast({
        title: "Uploading Image",
        description: "Please wait while your image is being uploaded...",
      });

      const imageUrl = await uploadImage(file);
      if (imageUrl && quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', imageUrl);
      }
      setIsUploading(false);
    };
  }, [uploadImage, toast]);

  const modulesWithImageHandler = {
    ...modules,
    toolbar: {
      ...modules.toolbar,
      handlers: {
        image: imageHandler,
      },
    },
  };

  React.useEffect(() => {
    if (enableImagePaste && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const container = quill.root;
      
      container.addEventListener('paste', handlePaste);
      
      return () => {
        container.removeEventListener('paste', handlePaste);
      };
    }
  }, [enableImagePaste, handlePaste]);

  return (
    <div className={cn("rich-text-editor w-full", className)}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modulesWithImageHandler}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'transparent',
          borderRadius: '6px',
          fontWeight: 'normal',
          fontSize: '14px',
          width: '100%',
          maxWidth: '100%',
        }}
      />
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>{`${(value || '').replace(/<[^>]+>/g, '').length} chars`}</span>
        {isUploading && <span>Uploading image…</span>}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor .ql-container {
            min-height: 200px !important;
            max-width: 100% !important;
            border-bottom-left-radius: 6px !important;
            border-bottom-right-radius: 6px !important;
            background-color: transparent !important;
          }
          .rich-text-editor .ql-container.ql-snow {
            border: 1px solid hsl(var(--border)) !important;
          }
          .rich-text-editor .ql-editor {
            font-weight: normal !important;
            font-family: inherit;
            font-size: 14px !important;
            line-height: 1.5;
            min-height: 150px !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            word-wrap: break-word !important;
            padding: 12px 15px !important;
            background-color: transparent !important;
            color: hsl(var(--foreground)) !important;
          }
          .rich-text-editor .ql-toolbar {
            max-width: 100% !important;
            overflow-x: auto !important;
            border-top-left-radius: 6px !important;
            border-top-right-radius: 6px !important;
            background-color: hsl(var(--muted)) !important;
            border: 1px solid hsl(var(--border)) !important;
          }
          .rich-text-editor .ql-toolbar .ql-picker-label,
          .rich-text-editor .ql-toolbar .ql-picker-item,
          .rich-text-editor .ql-toolbar button {
            color: hsl(var(--foreground)) !important;
          }
          .rich-text-editor .ql-toolbar button:hover {
            background-color: hsl(var(--accent)) !important;
          }
          .rich-text-editor .ql-editor p {
            font-weight: normal !important;
            font-size: 14px !important;
            margin-bottom: 0.5rem !important;
          }
          .rich-text-editor .ql-editor strong {
            font-weight: bold !important;
          }
          .rich-text-editor .ql-editor b {
            font-weight: bold !important;
          }
          .rich-text-editor .ql-editor li {
            font-size: 14px !important;
          }
          .rich-text-editor .ql-editor span {
            font-size: 14px !important;
          }
          .rich-text-editor .ql-editor h1 {
            font-size: 18px !important;
            font-weight: 600 !important;
            margin-bottom: 0.75rem !important;
          }
          .rich-text-editor .ql-editor h2 {
            font-size: 16px !important;
            font-weight: 600 !important;
            margin-bottom: 0.5rem !important;
          }
          .rich-text-editor .ql-editor h3 {
            font-size: 14px !important;
            font-weight: 600 !important;
            margin-bottom: 0.5rem !important;
          }
          .rich-text-editor .ql-editor blockquote {
            font-size: 14px !important;
            border-left: 4px solid #e2e8f0;
            padding-left: 16px;
            margin: 16px 0;
            font-style: italic;
          }
          .rich-text-editor .ql-editor code {
            font-size: 13px !important;
            background-color: #f1f5f9;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', Courier, monospace;
          }
          .rich-text-editor .ql-editor pre {
            font-size: 13px !important;
            background-color: #1e293b;
            color: #f1f5f9;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 16px 0;
            font-family: 'Courier New', Courier, monospace;
          }
          .rich-text-editor .ql-editor pre code {
            background-color: transparent !important;
            color: inherit !important;
            padding: 0 !important;
          }
          .rich-text-editor .ql-editor img {
            max-width: 100%;
            height: auto;
            margin: 10px 0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .rich-text-editor .ql-editor ul, .rich-text-editor .ql-editor ol {
            margin: 8px 0;
            padding-left: 24px;
          }
          .rich-text-editor .ql-toolbar .ql-picker-label {
            font-size: 14px !important;
          }
          .rich-text-editor .ql-toolbar .ql-picker-item {
            font-size: 14px !important;
          }
        `
      }} />
    </div>
  );
};
