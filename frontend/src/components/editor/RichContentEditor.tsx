import { useState, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import type { ReportSection } from '../../data/reportSections';
import { contentToHtml, htmlToContent } from './richTextSerializer';
import { MddReference } from './MddReferenceNode';
import { mddTables } from '../../data/tableRegistry';
import TableOfContentsView from './TableOfContentsView';

interface Props {
  section: ReportSection;
  onSave: (sectionId: string, newContent: string, reason: string) => void;
  onCancel: () => void;
  allSections?: ReportSection[];
}

// A single Word-like toolbar button.
function TbButton({ onClick, active, disabled, title, children }: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => e.preventDefault()} // keep editor selection
      onClick={onClick}
      disabled={disabled}
      className={`rte-btn ${active ? 'active' : ''}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onInsertMddTable, onInsertImage, onInsertFootnote }: { editor: Editor; onInsertMddTable: () => void; onInsertImage: () => void; onInsertFootnote: () => void }) {
  const styleValue = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p';

  const applyStyle = (value: string) => {
    const chain = editor.chain().focus();
    if (value === 'h1') chain.setHeading({ level: 1 }).run();
    else if (value === 'h2') chain.setHeading({ level: 2 }).run();
    else if (value === 'h3') chain.setHeading({ level: 3 }).run();
    else chain.setParagraph().run();
  };

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL (leave blank to remove):', prev ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div className="rte-toolbar">
      <select
        className="rte-style-select"
        title="Paragraph style"
        value={styleValue}
        onMouseDown={e => e.stopPropagation()}
        onChange={e => applyStyle(e.target.value)}
      >
        <option value="p">Body text (nov_text_body)</option>
        <option value="h1">Heading 1 (nov_title_main_level_section)</option>
        <option value="h2">Heading 2 (nov_title_main_level_section_2)</option>
        <option value="h3">Heading 3 (nov_title_body_level_1)</option>
      </select>

      <span className="rte-sep" />

      <TbButton title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></TbButton>
      <TbButton title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></TbButton>
      <TbButton title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><span style={{ textDecoration: 'underline' }}>U</span></TbButton>
      <TbButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{ textDecoration: 'line-through' }}>S</span></TbButton>
      <TbButton title="Link" active={editor.isActive('link')} onClick={setLink}>🔗</TbButton>

      <span className="rte-sep" />

      <TbButton title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</TbButton>
      <TbButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</TbButton>
      <TbButton title="Block quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</TbButton>

      <span className="rte-sep" />

      <TbButton title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⬅</TbButton>
      <TbButton title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>↔</TbButton>
      <TbButton title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>➡</TbButton>
      <TbButton title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>☰</TbButton>

      <span className="rte-sep" />

      <TbButton title="Insert an MDD data table (reference-only; data is maintained in MDD)" onClick={onInsertMddTable}>⛁ MDD table</TbButton>
      <TbButton title="Upload an image from your computer" onClick={onInsertImage}>🖼 Image</TbButton>
      <TbButton title="Insert footnote" onClick={onInsertFootnote}>⁋ Footnote</TbButton>

      <span className="rte-sep" />

      <TbButton title="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↺</TbButton>
      <TbButton title="Redo (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↻</TbButton>
    </div>
  );
}

export default function RichContentEditor({ section, onSave, onCancel, allSections }: Props) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reason, setReason] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: true }),
      MddReference,
    ],
    content: contentToHtml(section.content),
    editorProps: {
      attributes: { class: 'rte-surface', spellcheck: 'true' },
    },
  });

  if (!editor) return null;

  // The Table of Contents is generated from the chapter structure and is not
  // free-text editable — show the live auto-generated ToC instead of the editor.
  if (section.topicL1 === 'Table of Contents') {
    return (
      <div className="content-editor">
        <div className="editor-toolbar" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Table of contents — auto-generated from the report chapters</span>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn-secondary" onClick={onCancel}>Close</button>
          </div>
        </div>
        <TableOfContentsView sections={allSections} />
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
          This page updates automatically when chapters are added, removed or reordered. Real page numbers are inserted by Word when the exported document is opened.
        </div>
      </div>
    );
  }

  const insertMddBlock = (raw: string) => {
    editor.chain().focus().insertContent({ type: 'mddReference', attrs: { raw } }).run();
  };

  // Upload an image file from the computer: read it as a data URL and insert it
  // as a real image in the document. Persists in the content string as markdown
  // ![alt](dataurl), so it round-trips through save/reload/read-view/export.
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file (PNG, JPG, GIF, SVG, WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      window.alert('Image is larger than 5 MB. Please choose a smaller file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
  };

  const onImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  // Toolbar image button: open the OS file picker to upload from the computer.
  const handleInsertImage = () => fileInputRef.current?.click();

  // Insert a footnote at the cursor as a "[^ text ]" marker (round-trips through
  // the content string; rendered as a superscript + footnotes list, and exported
  // as a Word footnote). Prompt keeps the demo simple and text-model-friendly.
  const handleInsertFootnote = () => {
    const text = window.prompt('Footnote text:');
    if (!text || !text.trim()) return;
    editor.chain().focus().insertContent(`[^ ${text.trim()} ]`).run();
  };

  const currentContent = () => htmlToContent(editor.getHTML());
  const hasChanges = currentContent() !== section.content;

  const handleSave = () => {
    if (!reason.trim()) return;
    onSave(section.id, currentContent(), reason.trim());
    setShowSaveModal(false);
    setReason('');
  };

  return (
    <div className="content-editor">
      <div className="editor-toolbar" style={{ alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Editing: {section.title}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" disabled={!hasChanges} onClick={() => setShowSaveModal(true)}>Save Changes</button>
        </div>
      </div>

      <Toolbar editor={editor} onInsertMddTable={() => setShowTablePicker(true)} onInsertImage={handleInsertImage} onInsertFootnote={handleInsertFootnote} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onImageInputChange}
      />

      <EditorContent editor={editor} />

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
        Word-like editing with a fixed standard font (no font selection — Novartis MDD fonts are applied at export). Formatting is limited to bold, italic, underline, lists and footnotes. Use <strong>⛁ MDD table</strong> to insert a reference to an MDD-managed table: the data is maintained in MDD (FRA), shown here read-only for context, and replaced with the MDD code on export. Citation markers (<code>[1]</code>) and footnotes (<code>[^ … ]</code>) are preserved and become Word footnotes/MDD code on export.
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        🖼 Uploaded photos are shown at a reduced size here for easier reading while you edit — the full-size original is embedded when the report is exported to Word.
      </div>

      {/* Insert-table picker — choose from the MDD table registry */}
      {showTablePicker && (
        <div className="save-reason-modal" onClick={() => setShowTablePicker(false)}>
          <div className="save-reason-content" onClick={e => e.stopPropagation()} style={{ width: '520px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>Insert MDD table</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Pick a table from the MDD registry. The data is shown for reference while drafting and replaced with the code on export.
            </p>
            <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.values(mddTables).map(t => (
                <button
                  key={t.code}
                  className="btn-secondary"
                  style={{ textAlign: 'left', padding: '10px 12px' }}
                  onClick={() => { insertMddBlock(`[Table Reference: ${t.code}]`); setShowTablePicker(false); }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.code} · {t.columns.length} cols · {t.rows.length} rows</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn-ghost" onClick={() => setShowTablePicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="save-reason-modal">
          <div className="save-reason-content">
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Save Changes</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Describe what you changed and why. This will be recorded in the audit trail.
            </p>
            <textarea
              className="approval-comment-input"
              placeholder="e.g., Updated Scope 3 figures with FY2025 actuals from CDP submission"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={!reason.trim()} onClick={handleSave}>Save with Reason</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
