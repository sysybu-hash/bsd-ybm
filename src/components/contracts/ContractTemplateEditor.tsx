'use client';

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { CONTRACT_PLACEHOLDER_HELP } from '@/lib/contracts/placeholders';

import '@/components/contracts/tiptap.css';

type Props = {
  initialHtml: string;
  onChangeHtml: (html: string) => void;
  editable?: boolean;
};

export default function ContractTemplateEditor({ initialHtml, onChangeHtml, editable = true }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({
        placeholder: 'הקלידו כאן את תנאי ההסכם…',
      }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: initialHtml || '<p></p>',
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'bsd-tiptap-editor min-h-[280px] rounded-[32px] border border-gray-200 bg-white px-4 py-4 text-right text-sm text-[#1a1a1a] focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeHtml(ed.getHTML());
    },
  });

  if (!mounted || !editor) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[32px] border border-gray-200 bg-[#FDFDFD] text-sm text-gray-500">
        טוען עורך…
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-4">
      <p className="text-center text-xs font-bold text-[#001A4D]" dir="rtl">
        משתנים: {CONTRACT_PLACEHOLDER_HELP}
      </p>
      <EditorContent editor={editor} className="w-full" />
    </div>
  );
}
