
import DOMPurify from 'dompurify';

// Configure DOMPurify with secure defaults
const sanitizeConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
  ALLOWED_ATTR: ['class'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover'],
  FORBID_TAGS: ['script', 'object', 'embed', 'base', 'link', 'meta', 'iframe'],
  ALLOW_DATA_ATTR: false,
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
