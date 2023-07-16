import React, { useEffect, useRef, useLayoutEffect, useState } from "react";
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
  const defaultAPIUrl = "https://matthoffner-wizardcoder-ggml.hf.space/v0/chat/completions";
  const urlParams = new URLSearchParams(window.location.search);
  const API_URL = urlParams.get('API_URL') || defaultAPIUrl;
  const ref = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);
  const [executing, setExecuting] = useState(false);

  const handlePlayClick = () => {
    const editor = editorRef.current;
    if (editor) {
      const newValue = editor.getValue();
      const encodedJs = encodeURIComponent(newValue);
      const dataUri = "data:text/javascript;charset=utf-8," + encodedJs;
      
      setExecuting(true);
      import(dataUri)
        .then(() => setExecuting(false))
        .catch((error) => {
          console.error('Error executing code:', error);
          setExecuting(false);
        });
    }
  };

  useLayoutEffect(() => {
    modelRef.current = monaco.editor.createModel(
      value,
      'javascript',
      monaco.Uri.file(`index.js`)
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

    const dispose = MonacoEditorCopilot(editor, { testName: 'basic example', llmUrl: API_URL } as any);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div id="editor" ref={ref} style={{ flexGrow: 1 }}></div>
      <button
        onClick={handlePlayClick}
        disabled={executing}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          margin: '10px',
          backgroundColor: executing ? 'gray' : '#007acc',
          color: 'white',
          borderRadius: '4px',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        {executing ? 'Executing...' : 'Play'}
      </button>
    </div>
  );
};

export default Editor;
