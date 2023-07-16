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

// You would define these outside of the function
let inCodeBlock = false;
let codeBlockLanguage = '';

function guessLanguage(input) {
  let language = 'html';
  let content = input;
  input = input.trim();

  if (inCodeBlock) {
    if (input === '```') {
      inCodeBlock = false;
      if (codeBlockLanguage === 'css') {
        content = '</style>';
      } else {
        content = '';
      }
    }
  } else if (input.startsWith('<')) {
    language = 'html';
  } else if (input.startsWith('```python')) {
    inCodeBlock = true;
    codeBlockLanguage = 'python';
    language = 'python';
    content = content.replace('```python\n', '');
  } else if (input.startsWith('```javascript')) {
    inCodeBlock = true;
    codeBlockLanguage = 'javascript';
    language = 'javascript';
    content = content.replace('```javascript\n', '');
  } else if (input.startsWith('```html')) {
    inCodeBlock = true;
    codeBlockLanguage = 'html';
    language = 'html';
    content = content.replace('```html\n', '');
  } else if (input.startsWith('```css')) {
    inCodeBlock = true;
    codeBlockLanguage = 'css';
    language = 'css';
    content = '<style>' + content.replace('```css\n', '');
  }

  return { language, content };
}

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
    const { language, content } = guessLanguage(externalUpdate);
    modelRef.current = monaco.editor.createModel(
      content,
      language,
      monaco.Uri.file(`index.${language}`)
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

  useEffect(() => {
    const editor = editorRef.current;
    const model = modelRef.current;

    if (editor && model) {
      const { language, content } = guessLanguage(externalUpdate);

      if (model.getModeId() !== language) {
        model.dispose();
        modelRef.current = monaco.editor.createModel(
          content,
          language,
          monaco.Uri.file(`index.${language}`)
        );
        editor.setModel(modelRef.current);
      } else if (editor.getValue() !== content) {
        editor.pushUndoStop();
        editor.executeEdits('', [
          {
            range: model.getFullModelRange(),
            text: content,
          },
        ]);
        editor.pushUndoStop();
      }
    }
  }, [externalUpdate]);

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
