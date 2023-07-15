import React, { useEffect, useState, useCallback } from "react";
import Editor from './editor'
import Chat from './chat';
import { fetchSSE } from './fetch-sse';
import { HTML } from "./prompts";
const defaultAPIUrl = "https://matthoffner-wizardcoder-ggml.hf.space/v1/chat/completions";
const App = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const API_URL = urlParams.get('API_URL') || defaultAPIUrl;
  const [messages, setMessages] = useState([{ role: 'system', content: `🪄 Welcome to WizardCodeSandbox 🪄 ${HTML}` }]);
  const [fetchController, setFetchController] = useState<AbortController | null>(null);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [horizontalSplit, setHorizontalSplit] = useState(50);
  const [verticalSplit, setVerticalSplit] = useState(50);
  const [editorContent, setEditorContent] = useState('');
  const [iteration, setIteration] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [bufferContent, setBufferContent] = useState('');
  const [showBuffer, setShowBuffer] = useState(false);
  const [clearMode, setClearMode] = useState(urlParams.get('clearMode') || false);
  const [autoMode, setAutoMode] = useState(urlParams.get('autoMode') || false);

  useEffect(() => {
    setBufferContent(editorContent);
  }, [editorContent]);


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

  /*
  let snippets = []
  const saveSnippet = () => {
    import('html2canvas').then(c => c.default(document.getElementById('livePreview')).then(canvas => {
      snippets = [{
        snapshot: canvas.toDataURL(),
        savedCode: editorContent
      }, editorContent]
      return snippets;
    })).then(saved => {
      saveCode(editorContent);
    });
  }
  */

  const handleFetchSSE = useCallback((newMessage: string | { role: string, content: string }) => {
    setIsStreaming(true);
    const controller = new AbortController();
    setFetchController(controller);

    if (typeof newMessage === 'string') {
      newMessage = { role: 'user', content: newMessage };
    }

    const body = JSON.stringify({
      messages: [...messages, newMessage],
    });

    fetchSSE(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      signal: controller.signal,
      onMessage: data => {
        if (data === "[DONE]") {
          setIteration(prevIteration => {
            const newIteration = prevIteration + 1;
            clearMode && setEditorContent('');
            // todo: persist editorContent at this point
            autoMode && handleFetchSSE('Good job! Create an improved version.');
            return newIteration;
          });
          return;
        }
        try {
          const response = JSON.parse(data);
          if (response && response.choices && response.choices.length) {
            const text = response.choices[0].message.content;
            const finishReason = response.choices[0].finish_reason;
            setEditorContent(prevContent => prevContent + text);
            if (finishReason === 'stop') {
              setIsStreaming(false);
            }
          }
        } catch (err) {
          console.warn("llm stream SSE event unexpected error", err);
        }
      },
      onError: error => {
        setIsStreaming(false);
        console.error('Fetch SSE Error:', error);
      },
    });

    // Clean up the effect
    return () => {
      controller.abort();
    };
  }, [messages, initialPrompt]);  
  

  const stopFetch = () => {
    if (fetchController) {
      fetchController.abort();
      setFetchController(null);
      setIsStreaming(false);
    }
  }

  const stopButtonStyle = {
    width: '250px',
    border: 'none',
    color: '#D8DEE9',
    backgroundColor: '#434C5E',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    margin: '10px auto',
    display: 'block',
  };

  const stopButtonContainerStyle = {
    backgroundColor: '#2E3440',
    padding: '10px',
  };


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
        <Chat messages={messages} setMessages={setMessages} initialPrompt={initialPrompt} setInitialPrompt={setInitialPrompt} iteration={iteration} onSubmit={handleFetchSSE} onStop={stopFetch} />
        <div style={stopButtonContainerStyle}>
          {isStreaming && (
              <button style={stopButtonStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5E81AC'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#434C5E'} onClick={stopFetch}>Stop Generating</button>
          )}
        </div>
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
      >
        <iframe
          title="visible-iframe"
          srcDoc={!showBuffer ? editorContent : ''}
          style={{display: !showBuffer ? 'block' : 'none', width: '100%', height: '200px'}}
          onLoad={() => showBuffer && setShowBuffer(false)}
        />

        <iframe
          title="buffer-iframe"
          srcDoc={showBuffer ? bufferContent : ''}
          style={{display: showBuffer ? 'block' : 'none', width: '100%', height: '200px'}}
          onLoad={() => !showBuffer && setShowBuffer(true)}
        />
      </div>
    </div>
  );
};

export default App;
