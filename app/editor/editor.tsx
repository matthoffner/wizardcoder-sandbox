import React, { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
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
  const [content, setContent] = useState(externalUpdate);

  useEffect(() => {
    onContentChange(externalUpdate);
  }, [content, onContentChange, externalUpdate]);

  useLayoutEffect(() => {
    const model = monaco.editor.createModel(
      externalUpdate,
      'typescript',
      monaco.Uri.file('index.ts')
    );
    const editor = createConfiguredEditor(ref.current!, {
      model,
      automaticLayout: true,
    });
    editor.onDidChangeModelContent(() => {
      setContent(editor.getValue());
    });
    editor.onDidChangeModelContent(() => {});

    const dispose = MonacoEditorCopilot(editor, { testName: 'basic example' } as any);
    if (config[0]?.testName === 'example with dispose') {
      setTimeout(() => {
        dispose();
      }, 1000);
    }

    return () => {
      model.dispose();
      editor.dispose();
    };
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
      <div style={{ display: 'flex', marginTop: '10px' }}>
      </div>
    </div>
  );
};

export default Editor;
