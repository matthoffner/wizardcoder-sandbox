import React, { useState, useCallback, useEffect } from "react";
import Editor from './editor'
import Chat from './chat';
import { fetchSSE, llmError } from './fetch-sse';

const App = () => {
  const [horizontalSplit, setHorizontalSplit] = useState(50);
  const [verticalSplit, setVerticalSplit] = useState(50);
  const [editorContent, setEditorContent] = useState('');

  const handleMouseMoveHorizontal = useCallback(
    (e) => {
      setHorizontalSplit((e.clientX / window.innerWidth) * 100);
    },
    [setHorizontalSplit]
  );

  const handleMouseMoveVertical = useCallback(
    (e) => {
      setVerticalSplit((e.clientY / window.innerHeight) * 100);
    },
    [setVerticalSplit]
  );

  const handleMouseUp = useCallback(() => {
    window.removeEventListener("mousemove", handleMouseMoveHorizontal);
    window.removeEventListener("mousemove", handleMouseMoveVertical);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMoveHorizontal, handleMouseMoveVertical]);

  const handleMouseDownHorizontal = useCallback(() => {
    window.addEventListener("mousemove", handleMouseMoveHorizontal);
    window.addEventListener("mouseup", handleMouseUp);
  }, [handleMouseMoveHorizontal, handleMouseUp]);

  const handleMouseDownVertical = useCallback(() => {
    window.addEventListener("mousemove", handleMouseMoveVertical);
    window.addEventListener("mouseup", handleMouseUp);
  }, [handleMouseMoveVertical, handleMouseUp]);

const handleFetchSSE = useCallback((message) => {
  let text = '';
  fetchSSE('https://matthoffner-wizardcoder-ggml.hf.space/v0/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: message }),
    onMessage: data => {
      if (data === "[DONE]") {
        text = text.trim();
        setEditorContent(prevEditorContent => prevEditorContent + text);
        return;
      }
      try {
        const response = JSON.parse(data);
        if (response && response.length) {
          text += response || '';
          setEditorContent(text);
        }
      } catch (err) {
        console.warn("llm stream SEE event unexpected error", err);
      }
    },
    onError: error => {
      console.error('Fetch SSE Error:', error);
    },
  })
}, []);



  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <div
        style={{
          flexGrow: 1,
          flexBasis: `${horizontalSplit}%`,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        <div
          style={{
            flexGrow: 1,
            flexBasis: `${verticalSplit}%`,
            overflow: "auto",
          }}
        >
          <Editor onContentChange={setEditorContent} externalUpdate={editorContent} />
        </div>
        <div
          style={{
            height: "10px",
            cursor: "row-resize",
            backgroundColor: "lightgray",
          }}
          onMouseDown={handleMouseDownVertical}
        ></div>
        <Chat onSubmit={handleFetchSSE} />
      </div>
      <div
        style={{
          width: "10px",
          cursor: "col-resize",
          backgroundColor: "lightgray",
        }}
        onMouseDown={handleMouseDownHorizontal}
      ></div>
      <div
        style={{
          flexGrow: 1,
          flexBasis: `${100 - horizontalSplit}%`,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
        dangerouslySetInnerHTML={{ __html: editorContent || '' }}
      />
    </div>
  );
};

export default App;
