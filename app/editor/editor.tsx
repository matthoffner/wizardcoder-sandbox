import React, { useEffect, useRef, useLayoutEffect } from "react";
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { createConfiguredEditor } from 'vscode/monaco';
import './setup';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import MonacoEditorCopilot from './copilot';

const config = [
  {
    testName: 'example with dispose',
  },
];

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  jsx: monaco.languages.typescript.JsxEmit.Preserve,
});

const Editor = ({ externalUpdate, onContentChange }: { externalUpdate: string; onContentChange: (newContent: string) => void; }) => {
  const ref = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);

  useLayoutEffect(() => {
    modelRef.current = monaco.editor.createModel(
      '',
      'typescript',
      monaco.Uri.file('index.ts')
    );
    editorRef.current = createConfiguredEditor(ref.current!, {
      model: modelRef.current,
      automaticLayout: true,
    });
    const editor = editorRef.current;

    editor?.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onContentChange(value);
    });

    const dispose = MonacoEditorCopilot(editor, { testName: 'basic example' } as any);
    if (config[0]?.testName === 'example with dispose') {
      setTimeout(() => {
        dispose();
      }, 1000);
    }

    return () => {
      modelRef.current?.dispose();
      editorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const model = modelRef.current;

    if (editor && model) {
      const value = editor.getValue();
      if (value !== externalUpdate) {
        editor.pushUndoStop();
        editor.executeEdits('', [
          {
            range: model.getFullModelRange(),
            text: externalUpdate,
          },
        ]);
        editor.pushUndoStop();
      }
    }
  }, [externalUpdate]);

  const buttonStyle = {
    marginBottom: '10px',
    marginLeft: '10px',
    marginRight: '10px',
    flexGrow: 1,
    border: 'none',
    color: '#D8DEE9',
    backgroundColor: '#434C5E',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div id="editor" ref={ref} style={{ flexGrow: 1 }}></div>
    </div>
  );
};

export default Editor;
