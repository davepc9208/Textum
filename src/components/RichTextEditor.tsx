import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useState, useEffect } from 'react';
import {
  Bold, Italic, Heading2, List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Image upload to Supabase Storage ──────────────────────────────────────
async function uploadImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('blog-images').upload(path, file);
  if (error) {
    alert('Error al subir la imagen: ' + error.message);
    return null;
  }
  const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
  return data.publicUrl;
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
      className={`p-2 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-navy text-gold' : 'text-navy/60 hover:bg-navy/8 hover:text-navy'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main rich text editor ──────────────────────────────────────────────────
export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escribe el contenido del artículo...',
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
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

  if (!editor) return null;

  const handleImagePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) editor.chain().focus().setImage({ src: url }).run();
    e.target.value = '';
  };

  const handleLink = () => {
    const prevUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace:', prevUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-navy/15 rounded-sm overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-2 border-b border-navy/10 bg-navy/3">
        <ToolbarButton title="Negrita" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Cursiva" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Subtítulo" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </ToolbarButton>
        <div className="w-px h-5 bg-navy/15 mx-1" />
        <ToolbarButton title="Lista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton title="Cita" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>
        <div className="w-px h-5 bg-navy/15 mx-1" />
        <ToolbarButton title="Enlace" active={editor.isActive('link')} onClick={handleLink}>
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Insertar imagen" onClick={handleImagePick} disabled={uploading}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        </ToolbarButton>
        <div className="w-px h-5 bg-navy/15 mx-1" />
        <ToolbarButton title="Deshacer" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton title="Rehacer" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
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

      {/* Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
