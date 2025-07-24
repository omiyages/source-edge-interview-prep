
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
          fontSize: '14px', // Minimum 14px
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .ql-editor {
            font-weight: normal !important;
            font-family: inherit;
            font-size: 14px !important;
            line-height: 1.5;
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
