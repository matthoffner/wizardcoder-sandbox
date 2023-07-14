import React, { useEffect, useState, useCallback } from "react";
import Editor from './editor'
import Chat from './chat';
import { fetchSSE } from './fetch-sse';
import { HTML } from "./prompts";
const defaultAPIUrl = "https://matthoffner-wizardcoder-ggml.hf.space/v1/chat/completions";
const App = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const API_URL = urlParams.get('API_URL') || defaultAPIUrl;

  const [messages, setMessages] = useState([{ role: 'system', content: '🪄 Welcome to WizardCodeSandbox 🪄' }]);
  const [fetchController, setFetchController] = useState<AbortController | null>(null);
  const [initialPrompt, setInitialPrompt] = useState(`${HTML} <div></div> updated html:`);
  const [horizontalSplit, setHorizontalSplit] = useState(50);
  const [verticalSplit, setVerticalSplit] = useState(50);
  const [editorContent, setEditorContent] = useState('');
  const [iteration, setIteration] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false); // <-- New state


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

  const handleFetchSSE = useCallback((newMessage: string | { role: string, content: string }) => {
    setIsStreaming(true);
  
    if (typeof newMessage === 'string') {
      newMessage = { role: 'user', content: newMessage };
    }
  
    const body = JSON.stringify({
      messages: [...messages, newMessage],
    });
  
    // POST the initial data using fetch
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });
  
    // Listen for updates using EventSource
    const eventSource = new EventSource(API_URL);
  
    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        const response = JSON.parse(data);
        if (response && response.choices && response.choices.length) {
          const text = response.choices[0].message.content;
          const finishReason = response.choices[0].finish_reason;
          setEditorContent((prevContent: string) => prevContent + text);
  
          // Check if stop token has been reached
          if (finishReason === 'stop') {
            setIsStreaming(false);
          }
        }
      } catch (err) {
        console.warn("llm stream SSE event unexpected error", err);
      }
    };
  
    eventSource.addEventListener('done', () => {
      setIsStreaming(false);
      setIteration((prevIteration: number) => {
        const newIteration = prevIteration + 1;
        handleFetchSSE(`${initialPrompt} ${editorContent} updated html: `);
        return newIteration;
      });
      // Close the EventSource when we're done
      eventSource.close();
    });
    
    eventSource.onerror = (error: Event) => {
      setIsStreaming(false);
      console.error('Fetch SSE Error:', error);
      // Close the EventSource in case of error
      eventSource.close();
    };
  
    // Close the EventSource when the component unmounts
    return () => eventSource.close();
  
  }, [messages]);
  
  

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
        dangerouslySetInnerHTML={{ __html: editorContent || '' }}
      />
    </div>
  );
};

export default App;
