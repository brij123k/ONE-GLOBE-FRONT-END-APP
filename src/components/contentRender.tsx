import React from 'react';
import DOMPurify from 'dompurify';

interface ContentRendererProps {
  content: string;
}

interface StyleMap {
  [key: string]: string;
}

interface ColorMap {
  [key: string]: string;
}

interface FontMap {
  [key: string]: string;
}

const contentRender: React.FC<ContentRendererProps> = ({ content }) => {
  // Function to process and style blog content
  const processBlogContent = (htmlContent: string): string => {
    // Sanitize the HTML content with broad tag and attribute support
    let sanitizedContent = DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span', 'strong', 'em', 'ul', 'ol', 'li',
        'img', 'a', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'br', 'hr', 'sub', 'sup', 'u', 's', 'iframe', 'figure', 'figcaption', 'video', 'audio', 'source'
      ],
      ADD_ATTR: [
        'style', 'href', 'target', 'rel', 'alt', 'src', 'width', 'height', 'class',
        'align', 'title', 'frameborder', 'allowfullscreen', 'controls', 'poster', 'data-font',
        'data-background', 'data-indent', 'data-align'
      ],
    });

    // Create a temporary container to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedContent, 'text/html');

    // Function to map inline styles to Tailwind classes
    const mapInlineStyles = (styleString: string, element: HTMLElement): string[] => {
      const classes: string[] = [];
      if (!styleString) return classes;

      // Parse style string into key-value pairs
      const styles = styleString.split(';').reduce<StyleMap>((acc, style) => {
        const [key, value] = style.split(':').map(s => s.trim());
        if (key && value) acc[key.toLowerCase()] = value.toLowerCase();
        return acc;
      }, {});

      // Map text alignment
      if (styles['text-align']) {
        const alignMap: StyleMap = {
          'left': 'text-left',
          'center': 'text-center',
          'right': 'text-right',
          'justify': 'text-justify'
        };
        classes.push(alignMap[styles['text-align']] || 'text-left');
      }

      // Map text colors
      if (styles['color']) {
        const colorMap: ColorMap = {
          '#ff6600': 'text-orange-600',
          'rgb(255, 102, 0)': 'text-orange-600',
          '#000000': 'text-black',
          '#ffffff': 'text-white',
          '#ff0000': 'text-red-600',
          '#00ff00': 'text-green-600',
          '#0000ff': 'text-blue-600',
          '#333333': 'text-gray-800',
          '#666666': 'text-gray-600',
          '#4d2c5e': 'text-purple-900',
          '#9f7aea': 'text-purple-500',
          '#38b2ac': 'text-teal-500',
          '#4299e1': 'text-blue-500',
          '#ed8936': 'text-orange-500',
          '#ecc94b': 'text-yellow-500'
        };
        const color = styles['color'];
        if (colorMap[color]) {
          classes.push(colorMap[color]);
        } else {
          // Preserve custom colors as inline style
          element.style.color = color;
        }
      }

      // Map background colors
      if (styles['background-color']) {
        const bgColorMap: ColorMap = {
          '#ff6600': 'bg-orange-600',
          'rgb(255, 102, 0)': 'bg-orange-600',
          '#000000': 'bg-black',
          '#ffffff': 'bg-white',
          '#ff0000': 'bg-red-600',
          '#00ff00': 'bg-green-600',
          '#0000ff': 'bg-blue-600',
          '#333333': 'bg-gray-800',
          '#666666': 'bg-gray-600',
          '#4d2c5e': 'bg-purple-900',
          '#9f7aea': 'bg-purple-500',
          '#38b2ac': 'bg-teal-500',
          '#4299e1': 'bg-blue-500',
          '#ed8936': 'bg-orange-500',
          '#ecc94b': 'bg-yellow-500',
          '#f7fafc': 'bg-gray-50',
          '#ebf8ff': 'bg-blue-50',
          '#fff5f5': 'bg-red-50',
          '#f0fff4': 'bg-green-50'
        };
        const bgColor = styles['background-color'];
        if (bgColorMap[bgColor]) {
          classes.push(bgColorMap[bgColor]);
        } else {
          // Preserve custom background colors as inline style
          element.style.backgroundColor = bgColor;
        }
      }

      // Map font families
      if (styles['font-family']) {
        const fontFamily = styles['font-family'].replace(/['"]/g, '');
        const fontMap: FontMap = {
          'arial': 'font-sans',
          'helvetica': 'font-sans',
          'times new roman': 'font-serif',
          'georgia': 'font-serif',
          'courier new': 'font-mono',
          'monospace': 'font-mono',
          'comic sans ms': 'font-comic',
          'impact': 'font-impact',
          'lucida sans unicode': 'font-sans',
          'tahoma': 'font-sans',
          'trebuchet ms': 'font-sans',
          'verdana': 'font-sans'
        };
        
        const lowerFontFamily = fontFamily.toLowerCase();
        if (fontMap[lowerFontFamily]) {
          classes.push(fontMap[lowerFontFamily]);
        } else {
          // Preserve custom font family as inline style
          element.style.fontFamily = fontFamily;
        }
      }

      // Map font sizes with responsive scaling
      if (styles['font-size']) {
        const fontSizeMap: StyleMap = {
          '10px': 'text-xs sm:text-xs',
          '12px': 'text-xs sm:text-sm',
          '14px': 'text-sm sm:text-base',
          '16px': 'text-base sm:text-lg',
          '18px': 'text-lg sm:text-xl',
          '20px': 'text-xl sm:text-2xl',
          '24px': 'text-2xl sm:text-3xl',
          '30px': 'text-3xl sm:text-4xl',
          '36px': 'text-4xl sm:text-5xl',
          '48px': 'text-5xl sm:text-6xl'
        };
        classes.push(fontSizeMap[styles['font-size']] || 'text-base');
      }

      // Map font weight
      if (styles['font-weight']) {
        const fontWeightMap: StyleMap = {
          'bold': 'font-bold',
          '700': 'font-bold',
          '600': 'font-semibold',
          '500': 'font-medium',
          '400': 'font-normal',
          '300': 'font-light',
          '200': 'font-extralight',
          '100': 'font-thin'
        };
        classes.push(fontWeightMap[styles['font-weight']] || 'font-normal');
      }

      // Map text decoration
      if (styles['text-decoration']) {
        const decorationMap: StyleMap = {
          'underline': 'underline',
          'line-through': 'line-through',
          'overline': 'overline',
          'underline line-through': 'underline line-through'
        };
        classes.push(decorationMap[styles['text-decoration']] || '');
      }

      // Map margins with responsive scaling
      if (styles['margin']) {
        const marginMap: StyleMap = {
          '0': 'm-0',
          '5px': 'm-1 sm:m-1.5',
          '10px': 'm-2 sm:m-2.5',
          '15px': 'm-3 sm:m-4',
          '20px': 'm-4 sm:m-5',
          '25px': 'm-5 sm:m-6',
          '30px': 'm-6 sm:m-7',
          'auto': 'mx-auto'
        };
        classes.push(marginMap[styles['margin']] || 'm-0');
      }

      // Map padding with responsive scaling
      if (styles['padding']) {
        const paddingMap: StyleMap = {
          '0': 'p-0',
          '5px': 'p-1 sm:p-1.5',
          '10px': 'p-2 sm:p-2.5',
          '15px': 'p-3 sm:p-4',
          '20px': 'p-4 sm:p-5',
          '25px': 'p-5 sm:p-6',
          '30px': 'p-6 sm:p-7'
        };
        classes.push(paddingMap[styles['padding']] || 'p-0');
      }

      // Map display
      if (styles['display']) {
        const displayMap: StyleMap = {
          'block': 'block',
          'inline': 'inline',
          'inline-block': 'inline-block',
          'flex': 'flex',
          'inline-flex': 'inline-flex',
          'grid': 'grid',
          'none': 'hidden'
        };
        classes.push(displayMap[styles['display']] || '');
      }

      // Map line height
      if (styles['line-height']) {
        const lineHeightMap: StyleMap = {
          '1': 'leading-none',
          '1.25': 'leading-tight',
          '1.375': 'leading-snug',
          '1.5': 'leading-normal',
          '1.625': 'leading-relaxed',
          '2': 'leading-loose'
        };
        const lineHeight = parseFloat(styles['line-height']);
        const closest = Object.keys(lineHeightMap).reduce((prev, curr) => {
          return (Math.abs(lineHeight - parseFloat(curr)) < Math.abs(lineHeight - parseFloat(prev))) ? curr : prev;
        });
        classes.push(lineHeightMap[closest] || 'leading-normal');
      }

      return classes.filter(Boolean);
    };

    // Function to apply Tailwind classes to elements
    const applyStyles = (element: Element): void => {
      if (!element || !element.tagName) return;

      const tagName = element.tagName.toLowerCase();
      let classes: string[] = [];

      // Handle all possible tags from blog editor with blog-like styling
      switch (tagName) {
        case 'h1':
          classes.push('text-4xl sm:text-5xl font-bold mb-2 sm:mb-4 mt-4 sm:mt-15 tracking-tight');
          break;
        case 'h2':
          classes.push('text-3xl sm:text-4xl font-semibold mb-2 sm:mb-3 mt-3 sm:mt-4 tracking-tight');
          break;
        case 'h3':
          classes.push('text-2xl sm:text-3xl font-semibold mb-2 sm:mb-3 mt-2 sm:mt-3');
          break;
        case 'h4':
          classes.push('text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 mt-3 sm:mt-4');
          break;
        case 'h5':
          classes.push('text-lg sm:text-xl font-semibold mb-2 sm:mb-3 mt-2 sm:mt-3');
          break;
        case 'h6':
          classes.push('text-base sm:text-lg font-semibold mb-2 sm:mb-3 mt-2 sm:mt-3');
          break;
        case 'p':
          classes.push('text-gray-700 text-base sm:text-lg leading-relaxed');
          break;
        case 'div':
          classes.push('mb-3 sm:mb-4');
          // Handle indentation for divs
          if (element.getAttribute('data-indent')) {
            const indent = element.getAttribute('data-indent');
            if (indent === '-1') {
              classes.push('ml-4 sm:ml-6');
            } else if (indent === '+1') {
              classes.push('ml-8 sm:ml-10');
            }
          }
          break;
        case 'span':
          classes.push('inline');
          // Handle font family from Quill's font dropdown
          if (element.getAttribute('data-font')) {
            const font = element.getAttribute('data-font')?.toLowerCase() || '';
            const fontMap: FontMap = {
              'arial': 'font-sans',
              'helvetica': 'font-sans',
              'times new roman': 'font-serif',
              'georgia': 'font-serif',
              'courier new': 'font-mono',
              'monospace': 'font-mono',
              'comic sans ms': 'font-comic',
              'impact': 'font-impact'
            };
            if (fontMap[font]) {
              classes.push(fontMap[font]);
            }
          }
          break;
        case 'ul':
          classes.push('list-disc pl-6 sm:pl-8 mb-3 sm:mb-4 text-gray-700');
          // Handle indentation for lists
          if (element.getAttribute('data-indent')) {
            const indent = element.getAttribute('data-indent');
            if (indent === '-1') {
              classes.push('ml-4 sm:ml-6');
            } else if (indent === '+1') {
              classes.push('ml-8 sm:ml-10');
            }
          }
          break;
        case 'ol':
          classes.push('list-decimal pl-6 sm:pl-8 mb-3 sm:mb-4 text-gray-700');
          // Handle indentation for lists
          if (element.getAttribute('data-indent')) {
            const indent = element.getAttribute('data-indent');
            if (indent === '-1') {
              classes.push('ml-4 sm:ml-6');
            } else if (indent === '+1') {
              classes.push('ml-8 sm:ml-10');
            }
          }
          break;
        case 'li':
          classes.push('text-base sm:text-lg mb-2 sm:mb-3 leading-relaxed');
          break;
        case 'img':
          classes.push('rounded-xl shadow-lg mb-3 sm:mb-4 mx-auto max-w-full h-auto object-cover');
          element.setAttribute('loading', 'lazy');
          break;
        case 'a':
          classes.push('text-orange-600 hover:underline font-medium transition-colors');
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
          break;
        case 'blockquote':
          classes.push('border-l-4 border-purple-500 bg-purple-50 p-4 sm:p-6 rounded-lg mb-3 sm:mb-4 text-gray-600 italic text-base sm:text-lg leading-relaxed');
          break;
        case 'code':
          // Don't add classes if inside a pre (code block)
          if (!element.closest('pre')) {
            classes.push('bg-gray-100 text-red-600 px-1 sm:px-2 py-0.5 rounded font-mono text-sm sm:text-base');
          }
          break;
        case 'pre':
          classes.push('bg-gray-800 text-gray-100 p-4 sm:p-6 rounded-xl mb-3 sm:mb-4 overflow-x-auto text-sm sm:text-base font-mono');
          break;
        case 'table':
          classes.push('w-full border-collapse mb-3 sm:mb-4');
          break;
        case 'thead':
          classes.push('bg-purple-100');
          break;
        case 'th':
          classes.push('border border-gray-200 px-4 sm:px-6 py-3 text-left font-semibold text-sm sm:text-base');
          break;
        case 'td':
          classes.push('border border-gray-200 px-4 sm:px-6 py-3 text-gray-700 text-sm sm:text-base');
          break;
        case 'hr':
          classes.push('border-t border-gray-300 my-3 sm:my-4');
          break;
        case 'br':
          classes.push('block');
          break;
        case 'sub':
          classes.push('text-xs sm:text-sm align-sub');
          break;
        case 'sup':
          classes.push('text-xs sm:text-sm align-super');
          break;
        case 'u':
          classes.push('underline');
          break;
        case 's':
          classes.push('line-through');
          break;
        case 'iframe':
          classes.push('w-full h-64 sm:h-96 rounded-xl mb-6 sm:mb-8');
          break;
        case 'video':
          classes.push('w-full rounded-xl mb-6 sm:mb-8');
          element.setAttribute('controls', 'true');
          break;
        case 'audio':
          classes.push('w-full mb-6 sm:mb-8');
          element.setAttribute('controls', 'true');
          break;
        case 'figure':
          classes.push('mb-6 sm:mb-8 text-center');
          break;
        case 'figcaption':
          classes.push('text-sm sm:text-base text-gray-500 italic mt-2 sm:mt-3');
          break;
        case 'strong':
          classes.push('font-bold text-gray-900');
          break;
        case 'em':
          classes.push('italic text-gray-800');
          break;
        default:
          // Fallback for unrecognized tags
          classes.push('text-gray-700 text-base sm:text-lg');
          break;
      }

      // Handle inline styles
      const style = element.getAttribute('style') || '';
      if (style) {
        classes.push(...mapInlineStyles(style, element as HTMLElement));
      }

      // Handle align attribute for older editors
      const align = element.getAttribute('align') || element.getAttribute('data-align');
      if (align) {
        const alignMap: StyleMap = {
          'left': 'text-left',
          'center': 'text-center',
          'right': 'text-right',
          'justify': 'text-justify'
        };
        classes.push(alignMap[align.toLowerCase()] || 'text-left');
      }

      // Handle background from Quill's background dropdown
      if (element.getAttribute('data-background')) {
        const bgColor = element.getAttribute('data-background') || '';
        const bgColorMap: ColorMap = {
          '#ff6600': 'bg-orange-600',
          'rgb(255, 102, 0)': 'bg-orange-600',
          '#000000': 'bg-black',
          '#ffffff': 'bg-white',
          '#ff0000': 'bg-red-600',
          '#00ff00': 'bg-green-600',
          '#0000ff': 'bg-blue-600',
          '#333333': 'bg-gray-800',
          '#666666': 'bg-gray-600',
          '#4d2c5e': 'bg-purple-900',
          '#9f7aea': 'bg-purple-500',
          '#38b2ac': 'bg-teal-500',
          '#4299e1': 'bg-blue-500',
          '#ed8936': 'bg-orange-500',
          '#ecc94b': 'bg-yellow-500'
        };
        if (bgColorMap[bgColor]) {
          classes.push(bgColorMap[bgColor]);
        } else {
          // Preserve custom background colors as inline style
          (element as HTMLElement).style.backgroundColor = bgColor;
        }
      }

      // Apply classes if any
      if (classes.length > 0) {
        const existingClasses = element.getAttribute('class') || '';
        element.setAttribute('class', `${existingClasses} ${classes.join(' ')}`.trim());
      }

      // Recursively process child elements
      Array.from(element.children).forEach((child) => applyStyles(child));
    };

    // Apply styles to all elements in the document body
    Array.from(doc.body.children).forEach((child) => applyStyles(child));

    // Serialize the processed HTML back to a string
    return doc.body.innerHTML;
  };

  // Process the content if provided
  const processedContent = content ? processBlogContent(content) : '';

  return (
    <div className="w-full max-w-none">
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
};

export default contentRender;