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

function guessLanguage(input) {
  input = input.trim();
  
  if (input.startsWith('<')) {
    return 'html';
  } else if (input.startsWith('```python')) {
    return 'python';
  } else if (input.startsWith('```javascript')) {
    return 'javascript';
  } else if (input.startsWith('```html')) {
    return 'html';
  } else {
    return 'plaintext';
  }
}

const Editor = ({ externalUpdate, onContentChange }: { externalUpdate: string; onContentChange: (newContent: string) => void; }) => {
  const defaultAPIUrl = "https://matthoffner-wizardcoder-ggml.hf.space/v0/chat/completions";
  const urlParams = new URLSearchParams(window.location.search);
  const API_URL = urlParams.get('API_URL') || defaultAPIUrl;
  const ref = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monaco.editor.ITextModel | null>(null);

  useLayoutEffect(() => {
    const language = guessLanguage(externalUpdate);
    modelRef.current = monaco.editor.createModel(
      '',
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
      const language = guessLanguage(externalUpdate);

      if (model.getModeId() !== language) {
        model.dispose();
        modelRef.current = monaco.editor.createModel(
          externalUpdate,
          language,
          monaco.Uri.file(`index.${language}`)
        );
        editor.setModel(modelRef.current);
      } else if (editor.getValue() !== externalUpdate) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div id="editor" ref={ref} style={{ flexGrow: 1 }}></div>
    </div>
  );
};

export default Editor;
