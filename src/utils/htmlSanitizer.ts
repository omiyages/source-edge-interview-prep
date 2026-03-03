
import DOMPurify from 'dompurify';

// Configure DOMPurify with secure defaults that preserve code formatting
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 
    'code', 'pre', 'span', 'div', 'img', 'kbd', 'samp', 'var'
  ],
  // Removed 'style' to prevent CSS injection attacks
  // Keep safe Quill list metadata so bullet/ordered lists round-trip correctly
  ALLOWED_ATTR: ['class', 'src', 'alt', 'width', 'height', 'data-list', 'data-indent'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta', 'iframe', 'form', 'input'],
  ALLOW_DATA_ATTR: false, // Disabled data attributes for stricter security
  // Stricter URI regexp - only allow http(s) and blob for images
  ALLOWED_URI_REGEXP: /^(?:(?:https?|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, sanitizeConfig);
};

export const formatAndSanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // First format the text (convert **bold** to <strong> and newlines to <br>)
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
    .replace(/  /g, '&nbsp;&nbsp;');
  
  // Then sanitize the HTML
  return sanitizeHtml(formatted);
};

export const stripHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};
