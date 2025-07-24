
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link'
];

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'white',
          borderRadius: '6px',
          minHeight: '300px',
          fontWeight: 'normal',
          fontSize: '16px', // Ensure minimum 16px
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .ql-editor {
            font-weight: normal !important;
            font-family: inherit;
            font-size: 16px !important;
            line-height: 1.5;
          }
          .ql-editor p {
            font-weight: normal !important;
            font-size: 16px !important;
          }
          .ql-editor strong {
            font-weight: bold !important;
          }
          .ql-editor b {
            font-weight: bold !important;
          }
          .ql-editor li {
            font-size: 16px !important;
          }
          .ql-editor span {
            font-size: 16px !important;
          }
        `
      }} />
    </div>
  );
};
