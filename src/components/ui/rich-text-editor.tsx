
// ABOUTME: Rich text editor component using ReactQuill for formatted text input
// ABOUTME: Provides toolbar for formatting options and maintains consistent styling with image paste support

import React, { useRef, useCallback } from 'react';
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

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `question-images/${fileName}`;

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
      const container = quill.container;
      
      container.addEventListener('paste', handlePaste);
      
      return () => {
        container.removeEventListener('paste', handlePaste);
      };
    }
  }, [enableImagePaste, handlePaste]);

  const isLargeEditor = className?.includes('min-h-[400px]');
  const editorHeight = isLargeEditor ? '400px' : '300px';
  
  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modulesWithImageHandler}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'white',
          borderRadius: '6px',
          minHeight: editorHeight,
          height: editorHeight,
          fontWeight: 'normal',
          fontSize: '14px',
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .ql-editor {
            font-weight: normal !important;
            font-family: inherit;
            font-size: 14px !important;
            line-height: 1.5;
            min-height: ${isLargeEditor ? '350px' : '250px'} !important;
          }
          .ql-container {
            min-height: ${editorHeight} !important;
          }
          .ql-editor p {
            font-weight: normal !important;
            font-size: 14px !important;
          }
          .ql-editor strong {
            font-weight: bold !important;
          }
          .ql-editor b {
            font-weight: bold !important;
          }
          .ql-editor li {
            font-size: 14px !important;
          }
          .ql-editor span {
            font-size: 14px !important;
          }
          .ql-editor h1 {
            font-size: 18px !important;
          }
          .ql-editor h2 {
            font-size: 16px !important;
          }
          .ql-editor h3 {
            font-size: 14px !important;
          }
          .ql-editor blockquote {
            font-size: 14px !important;
          }
          .ql-editor code {
            font-size: 14px !important;
          }
          .ql-editor pre {
            font-size: 14px !important;
          }
          .ql-editor img {
            max-width: 100%;
            height: auto;
            margin: 10px 0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .ql-toolbar .ql-picker-label {
            font-size: 14px !important;
          }
          .ql-toolbar .ql-picker-item {
            font-size: 14px !important;
          }
        `
      }} />
    </div>
  );
};
