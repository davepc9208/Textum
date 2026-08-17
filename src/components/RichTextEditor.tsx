// src/components/RichTextEditor.tsx
// 
// EDITOR SUPERCOMPLETO PARA CONTENIDO ACADÉMICO
// Soporta: imágenes, tablas, listas anidadas, citas, código, 
// superíndice/subíndice, colores, resaltado, alineación, etc.

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Loader2, Check, X, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Underline as UnderlineIcon, Highlighter, Code,
  Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Palette, Minus, Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Configurar lowlight para código ──────────────────────────────────────
const lowlight = createLowlight();
lowlight.register('javascript', js);
lowlight.register('python', python);
lowlight.register('html', xml);
lowlight.register('css', css);

// ─── Image upload ──────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('blog-images').upload(path, file);
  if (error) {
    return { url: null, error: error.message };
  }
  const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}



/** Convierte texto plano en párrafos HTML */
function plainToParagraphs(plain: string): string {
  const lines = plain.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n+/);
  const parts = lines.map((l) => l.trim()).filter(Boolean);
  if (parts.length === 0) return '<p></p>';
  return parts.map((l) => `<p>${escapeHtml(l)}</p>`).join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Limpia HTML de Word/Docs para TipTap.
 * Word de escritorio a menudo trae color blanco, theme colors y basura MSO
 * que hace que el pegado "no se vea" o se descarte entero.
 */
function cleanPastedHtml(html: string): string {
  if (!html) return '';
  let out = html;
  const body = out.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) out = body[1];

  out = out
    .replace(/<!--\[if[\s\S]*?endif\]-->/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(html|head|meta|link|body|xml)[^>]*>/gi, '')
    .replace(/<\/?o:[^>]*>/gi, '')
    .replace(/<\/?w:[^>]*>/gi, '')
    .replace(/<\/?m:[^>]*>/gi, '')
    .replace(/<\/?v:[^>]*>/gi, '')
    .replace(/\s*mso-[a-z-]+:[^;"]+;?/gi, '')
    .replace(/\s*class="[^"]*Mso[^"]*"/gi, '')
    .replace(/\s*class='[^']*Mso[^']*'/gi, '')
    // Quitar TODOS los estilos inline (colores de Word = texto invisible)
    .replace(/\s*style="[^"]*"/gi, '')
    .replace(/\s*style='[^']*'/gi, '')
    // Quitar color/face en font legacy
    .replace(/<\/?font[^>]*>/gi, '')
    .replace(/<div(\s[^>]*)?>/gi, '<p>')
    .replace(/<\/div>/gi, '</p>')
    // spans vacíos o solo con formato → mantener contenido
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/(<p>\s*<\/p>\s*)+/gi, '<p></p>');

  // Normalizar etiquetas de formato que TipTap sí entiende
  out = out
    .replace(/<b(\s[^>]*)?>/gi, '<strong>')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<i(\s[^>]*)?>/gi, '<em>')
    .replace(/<\/i>/gi, '</em>');

  const textOnly = out.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return textOnly ? out.trim() : '';
}

/** Decide HTML final a insertar: limpio si conserva el texto; si no, plano */
function htmlForPaste(htmlRaw: string, plain: string): string {
  const cleaned = cleanPastedHtml(htmlRaw);
  const cleanedLen = cleaned.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length;
  const plainLen = plain.replace(/\s+/g, ' ').trim().length;

  // Si el HTML limpio pierde demasiado texto → usar plano con párrafos
  if (plainLen > 0 && (cleanedLen === 0 || cleanedLen < plainLen * 0.5)) {
    return plainToParagraphs(plain);
  }
  if (cleaned) return cleaned;
  if (plainLen > 0) return plainToParagraphs(plain);
  return '';
}

// ─── Toolbar button ─────────────────────────────────────────────────────────
function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={`p-1.5 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-navy text-gold' : 'text-navy/60 hover:bg-navy/8 hover:text-navy'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Toolbar separator ─────────────────────────────────────────────────────
function ToolbarSeparator() {
  return <span className="w-px h-5 bg-navy/15 mx-0.5" aria-hidden="true" />;
}

// ─── Link input inline ──────────────────────────────────────────────────────
function LinkInput({
  initialUrl,
  onConfirm,
  onRemove,
  onCancel,
}: {
  initialUrl: string;
  onConfirm: (url: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialUrl || 'https://');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onConfirm(value); }
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-navy/5 border-t border-navy/10 w-full">
      <input
        ref={inputRef}
        type="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://"
        className="flex-1 text-xs px-2 py-1 border border-navy/20 rounded-sm focus:outline-none focus:border-gold/50 bg-white text-navy"
      />
      <button
        type="button"
        onClick={() => onConfirm(value)}
        title="Confirmar enlace"
        className="p-1.5 rounded-sm bg-navy text-gold hover:bg-navy-light transition-colors"
      >
        <Check size={13} />
      </button>
      {initialUrl && (
        <button
          type="button"
          onClick={onRemove}
          title="Eliminar enlace"
          className="p-1.5 rounded-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <X size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        title="Cancelar"
        className="p-1.5 rounded-sm text-navy/40 hover:text-navy transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Image URL input ──────────────────────────────────────────────────────
function ImageUrlInput({
  onConfirm,
  onCancel,
}: {
  onConfirm: (url: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState('https://');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onConfirm(value); }
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-navy/5 border-t border-navy/10 w-full">
      <input
        ref={inputRef}
        type="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://ejemplo.com/imagen.jpg"
        className="flex-1 text-xs px-2 py-1 border border-navy/20 rounded-sm focus:outline-none focus:border-gold/50 bg-white text-navy"
      />
      <button
        type="button"
        onClick={() => onConfirm(value)}
        title="Insertar imagen"
        className="p-1.5 rounded-sm bg-navy text-gold hover:bg-navy-light transition-colors"
      >
        <Check size={13} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        title="Cancelar"
        className="p-1.5 rounded-sm text-navy/40 hover:text-navy transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Color picker ──────────────────────────────────────────────────────────
function ColorPicker({
  onSelect,
  onClose,
}: {
  onSelect: (color: string) => void;
  onClose: () => void;
}) {
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef',
    '#c9a84c', '#e6b800', '#ffcc00', '#f6b26b', '#e69138', '#d9662d', '#cc4125', '#a61c00',
    '#6d9eeb', '#4a86e8', '#3c78d8', '#1155cc', '#0b5394', '#073763',
    '#93c47d', '#6aa84f', '#38761d', '#274e13',
    '#d5a6bd', '#c27ba0', '#a64d79', '#741b47',
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-navy/5 border-t border-navy/10 w-full flex-wrap">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className="w-6 h-6 rounded-sm border border-navy/10 hover:border-gold transition-colors"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      <button
        type="button"
        onClick={onClose}
        className="p-1 ml-1 text-navy/40 hover:text-navy transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Main editor ────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onUploadError?: (message: string) => void;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escribe el contenido del artículo...',
  onUploadError,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const lastEmitted = useRef<string | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  // FIX: cargar CSS de syntax highlighting dinámicamente
  // para evitar que bloquee el render en la homepage
  useEffect(() => {
    import('highlight.js/styles/atom-one-dark.css');
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        codeBlock: false, // lo reemplazamos con CodeBlockLowlight
        // FIX: desactivar link en StarterKit — lo configuramos manualmente
        // abajo con HTMLAttributes para rel="noopener noreferrer"
        // Sin esto Tiptap v3 registra Link dos veces y muestra warning
        link: false,
      }),
      // Imágenes en línea
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'inline-block max-w-full h-auto rounded-sm shadow-md my-1',
        },
      }),
      // Tablas completas
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      // Alineación
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      // Formatos de texto
      Underline,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200/60 px-0.5',
        },
      }),
      Superscript,
      Subscript,
      // Colores
      TextStyle,
      Color,
      FontFamily,
      // Código con resaltado de sintaxis
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'rounded-sm text-sm',
        },
      }),
      // Enlaces
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-gold underline',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3 ' +
          // Estilos generales
          'prose-headings:font-serif prose-headings:text-navy ' +
          'prose-p:text-navy/80 prose-p:leading-relaxed ' +
          'prose-a:text-gold prose-a:no-underline hover:prose-a:underline ' +
          'prose-strong:text-navy prose-strong:font-semibold ' +
          'prose-em:text-navy/70 ' +
          'prose-blockquote:border-l-gold prose-blockquote:text-navy/60 prose-blockquote:font-serif prose-blockquote:italic ' +
          'prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-gold ' +
          // Imágenes
          'prose-img:rounded-sm prose-img:shadow-md ' +
          // Tablas
          'prose-table:border-collapse prose-table:w-full prose-table:my-4 ' +
          'prose-th:border prose-th:border-navy/20 prose-th:px-4 prose-th:py-2 prose-th:bg-navy/5 prose-th:text-left prose-th:font-semibold prose-th:text-navy ' +
          'prose-td:border prose-td:border-navy/20 prose-td:px-4 prose-td:py-2 ' +
          // Código
          'prose-code:bg-navy/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-navy ' +
          'prose-pre:bg-navy prose-pre:text-white prose-pre:rounded-sm prose-pre:p-4 prose-pre:overflow-x-auto ' +
          // Subíndice/Superíndice
          'prose-sub:align-sub prose-sup:align-super',
      },
      // Pegado controlado: Word/Docs a menudo falla con el parser por defecto
            handlePaste: (_view, event) => {
        const cd = event.clipboardData;
        if (!cd) return false;

        const htmlRaw = cd.getData('text/html') ?? '';
        const plain = cd.getData('text/plain') ?? '';

        // Imágenes puras
        const items = cd.items;
        const imageFiles: File[] = [];
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              const file = items[i].getAsFile();
              if (file) imageFiles.push(file);
            }
          }
        }
        const hasText =
          plain.trim().length > 0 ||
          htmlRaw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;

        if (imageFiles.length > 0 && !hasText) {
          event.preventDefault();
          (async () => {
            const ed = editorRef.current;
            for (const file of imageFiles) {
              const { url, error } = await uploadImage(file);
              if (error) {
                onUploadError?.(`Error al pegar imagen: ${error}`);
                continue;
              }
              if (url && ed) ed.chain().focus().setImage({ src: url }).run();
            }
          })();
          return true;
        }

        // Word / Docs / HTML con formato (+ imágenes del portapapeles si hay)
        if (htmlRaw.length > 10 || plain.trim().length > 0) {
          event.preventDefault();
          const toInsert = htmlForPaste(htmlRaw, plain);
          const ed = editorRef.current;
          if (ed && toInsert) {
            ed.chain().focus().insertContent(toInsert).run();
          } else if (ed && plain.trim()) {
            ed.chain().focus().insertContent(plainToParagraphs(plain)).run();
          }
          // Imágenes embebidas en el pegado de Word (archivos del clipboard)
          if (imageFiles.length > 0) {
            (async () => {
              for (const file of imageFiles) {
                const { url, error } = await uploadImage(file);
                if (error) {
                  onUploadError?.(`Error al pegar imagen: ${error}`);
                  continue;
                }
                if (url && editorRef.current) {
                  editorRef.current.chain().focus().setImage({ src: url }).run();
                }
              }
            })();
          }
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sincroniza contenido externo → editor sin pisar un pegado reciente
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (lastEmitted.current !== null && content === lastEmitted.current) return;
    if (content === current) return;
    const currentText = editor.getText().trim();
    if ((!content || content === '<p></p>') && currentText.length > 0) return;
    editor.commands.setContent(content || '', { emitUpdate: false });
  }, [content, editor]);

  const handleImagePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    const { url, error } = await uploadImage(file);
    setUploading(false);
    if (error) {
      onUploadError?.(`Error al subir la imagen: ${error}`);
    } else if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    e.target.value = '';
  }, [editor, onUploadError]);

  const handleLinkButtonClick = useCallback(() => {
    setShowLinkInput(prev => !prev);
    setShowImageUrlInput(false);
    setShowColorPicker(false);
  }, []);

  const handleImageUrlClick = useCallback(() => {
    setShowImageUrlInput(prev => !prev);
    setShowLinkInput(false);
    setShowColorPicker(false);
  }, []);

  const handleColorClick = useCallback(() => {
    setShowColorPicker(prev => !prev);
    setShowLinkInput(false);
    setShowImageUrlInput(false);
  }, []);

  const handleLinkConfirm = useCallback((url: string) => {
    if (!editor) return;
    if (!url || url === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShowLinkInput(false);
  }, [editor]);

  const handleLinkRemove = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

  const handleImageUrlConfirm = useCallback((url: string) => {
    if (!editor || !url || url === 'https://') return;
    editor.chain().focus().setImage({ src: url }).run();
    setShowImageUrlInput(false);
  }, [editor]);

  const handleInsertTable = useCallback(() => {
    if (!editor) return;
    editor.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const handleAddRow = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addRowAfter().run();
  }, [editor]);

  const handleAddCol = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().addColumnAfter().run();
  }, [editor]);

  const handleDeleteTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteTable().run();
  }, [editor]);

  if (!editor) return null;

  const currentLinkUrl = editor.getAttributes('link').href as string | undefined;
  const currentColor = editor.getAttributes('textStyle').color as string | undefined;

  return (
    <div className="border border-navy/15 rounded-sm overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-navy/10 bg-navy/3 sticky top-0 z-10">
        {/* ── Text styles ── */}
        <ToolbarButton
          title="Negrita (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Cursiva (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Subrayado (Ctrl+U)"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Headings ── */}
        <ToolbarButton
          title="Título H1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Título H2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Título H3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Título H4"
          active={editor.isActive('heading', { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <Heading4 size={15} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Lists ── */}
        <ToolbarButton
          title="Lista con viñetas"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Alignment ── */}
        <ToolbarButton
          title="Alinear izquierda"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Centrar"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Alinear derecha"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Justificar"
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify size={15} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Block elements ── */}
        <ToolbarButton
          title="Cita"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Resaltar texto"
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter size={15} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Superscript / Subscript ── */}
        <ToolbarButton
          title="Superíndice"
          active={editor.isActive('superscript')}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <SuperscriptIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Subíndice"
          active={editor.isActive('subscript')}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <SubscriptIcon size={15} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Color ── */}
        <ToolbarButton
          title="Color de texto"
          active={showColorPicker}
          onClick={handleColorClick}
        >
          <Palette size={15} style={{ color: currentColor || '#666' }} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Tables ── */}
        <ToolbarButton
          title="Insertar tabla (3x3)"
          onClick={handleInsertTable}
        >
          <TableIcon size={15} />
        </ToolbarButton>
        {editor.isActive('table') && (
          <>
            <ToolbarButton
              title="Añadir fila"
              onClick={handleAddRow}
            >
              <Plus size={15} className="rotate-90" />
            </ToolbarButton>
            <ToolbarButton
              title="Añadir columna"
              onClick={handleAddCol}
            >
              <Plus size={15} />
            </ToolbarButton>
            <ToolbarButton
              title="Eliminar tabla"
              onClick={handleDeleteTable}
            >
              <Minus size={15} />
            </ToolbarButton>
          </>
        )}

        <ToolbarSeparator />

        {/* ── Code ── */}
        <ToolbarButton
          title="Código en línea"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Bloque de código"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code size={15} className="border border-navy/30 rounded p-0.5" />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Links & Media ── */}
        <ToolbarButton
          title="Insertar enlace"
          active={editor.isActive('link') || showLinkInput}
          onClick={handleLinkButtonClick}
        >
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Insertar imagen (URL)"
          active={showImageUrlInput}
          onClick={handleImageUrlClick}
        >
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Subir imagen"
          onClick={handleImagePick}
          disabled={uploading}
        >
          {uploading
            ? <Loader2 size={15} className="animate-spin" />
            : <ImageIcon size={15} className="border border-navy/30 rounded p-0.5" />
          }
        </ToolbarButton>

        <ToolbarSeparator />

        {/* ── Undo/Redo ── */}
        <ToolbarButton
          title="Deshacer (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Rehacer (Ctrl+Y)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo size={15} />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Inputs inline ── */}
      {showLinkInput && (
        <LinkInput
          initialUrl={currentLinkUrl ?? ''}
          onConfirm={handleLinkConfirm}
          onRemove={handleLinkRemove}
          onCancel={() => setShowLinkInput(false)}
        />
      )}

      {showImageUrlInput && (
        <ImageUrlInput
          onConfirm={handleImageUrlConfirm}
          onCancel={() => setShowImageUrlInput(false)}
        />
      )}

      {showColorPicker && (
        <ColorPicker
          onSelect={(color) => {
            editor.chain().focus().setColor(color).run();
            setShowColorPicker(false);
          }}
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {/* ── Content ── */}
      <EditorContent editor={editor} />
    </div>
  );
}