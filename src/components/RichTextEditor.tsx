// src/components/RichTextEditor.tsx
//
// CAMBIOS vs versión anterior:
// 1. Link.configure: añadido HTMLAttributes con rel="noopener noreferrer" y
//    target="_blank" — todos los enlaces generados por Tiptap son seguros.
// 2. alert() eliminado — los errores de subida se propagan al padre
//    mediante la prop onUploadError (callback opcional).
// 3. window.prompt() eliminado — reemplazado por un input inline en el
//    toolbar que aparece al pulsar el botón de enlace (sin bloquear el hilo).
// 4. Timers (el único setTimeout existente estaba en Upload, que ya no existe)
//    no introducen nuevos leaks.

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Heading2, List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Loader2,
  Check, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Image upload to Supabase Storage ──────────────────────────────────────
// FIX: eliminado alert() — el error se devuelve y el padre decide cómo mostrarlo
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
      className={`p-2 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-navy text-gold' : 'text-navy/60 hover:bg-navy/8 hover:text-navy'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Link input inline (reemplaza window.prompt) ────────────────────────────
// Aparece en el toolbar al pulsar el botón de enlace — no bloquea el hilo JS
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

// ─── Main rich text editor ──────────────────────────────────────────────────
export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escribe el contenido del artículo...',
  onUploadError,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Callback opcional — recibe el mensaje de error si falla la subida de imagen */
  onUploadError?: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // FIX: reemplaza window.prompt — controla visibilidad del input inline
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      // FIX: rel="noopener noreferrer" en todos los enlaces generados por Tiptap
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({ HTMLAttributes: { class: 'rounded-sm max-w-full' } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[280px] px-4 py-3 ' +
          'prose-headings:font-serif prose-headings:text-navy prose-p:text-navy/80 ' +
          'prose-a:text-gold prose-strong:text-navy prose-blockquote:border-gold prose-blockquote:text-navy/60',
      },
    },
  });

  // Sincroniza el contenido cuando cambia desde fuera (ej. cambio de pestaña ES↔EN)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
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
      // FIX: sin alert() — delegamos al padre o ignoramos silenciosamente
      onUploadError?.(`Error al subir la imagen: ${error}`);
    } else if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    e.target.value = '';
  }, [editor, onUploadError]);

  // FIX: reemplaza window.prompt — abre el input inline
  const handleLinkButtonClick = useCallback(() => {
    setShowLinkInput(prev => !prev);
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

  if (!editor) return null;

  const currentLinkUrl = editor.getAttributes('link').href as string | undefined;

  return (
    <div className="border border-navy/15 rounded-sm overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-navy/10 bg-navy/3">
        <ToolbarButton
          title="Negrita"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Cursiva"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Subtítulo"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-navy/15 mx-1" aria-hidden="true" />

        <ToolbarButton
          title="Lista"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Cita"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-navy/15 mx-1" aria-hidden="true" />

        {/* FIX: onClick abre input inline en lugar de window.prompt */}
        <ToolbarButton
          title="Enlace"
          active={editor.isActive('link') || showLinkInput}
          onClick={handleLinkButtonClick}
        >
          <LinkIcon size={16} />
        </ToolbarButton>

        <ToolbarButton
          title="Insertar imagen"
          onClick={handleImagePick}
          disabled={uploading}
        >
          {uploading
            ? <Loader2 size={16} className="animate-spin" />
            : <ImageIcon size={16} />
          }
        </ToolbarButton>

        <div className="w-px h-5 bg-navy/15 mx-1" aria-hidden="true" />

        <ToolbarButton
          title="Deshacer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Rehacer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo size={16} />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* FIX: Input inline de enlace — reemplaza window.prompt */}
      {showLinkInput && (
        <LinkInput
          initialUrl={currentLinkUrl ?? ''}
          onConfirm={handleLinkConfirm}
          onRemove={handleLinkRemove}
          onCancel={() => setShowLinkInput(false)}
        />
      )}

      {/* Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
