import React, { useState, useRef, useEffect } from 'react';
import { HTML } from './prompts';

type ChatProps = {
  onSubmit: (value: string) => void;
  iteration?: number;
  onStop: any;
};

const Chat = ({ iteration, onSubmit, onStop }: ChatProps) => {
  const [value, setValue] = useState(`${HTML}`);
  const [messages, setMessages] = useState([{ from: 'system', content: '🪄 Welcome to WizardCodeSandbox 🪄' }]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iteration > 0) {
      setMessages((prevMessages) => [...prevMessages, { from: 'wizard', content: `v${iteration}` }]);
    }
  }, [iteration]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleSubmit = () => {
    setMessages((prevMessages) => [...prevMessages, { from: 'user', content: value }]);
    onSubmit(value);
    setValue('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


  const buttonStyle = {
    width: '100px',
    margin: '5px',
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '35%',
      backgroundColor: '#2E3440',
      color: '#D8DEE9',
      fontFamily: 'monospace',
      padding: '10px',
    }}>
      <div style={{ flexGrow: 1, overflow: 'auto', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ textAlign: message.from === 'user' ? 'right' : 'left' }}>
            <span>{message.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex' }}>
        <textarea
            style={{
              flexGrow: 1,
              backgroundColor: 'transparent',
              border: '1px solid #4C566A',
              borderRadius: '5px',
              outline: 'none',
              color: '#D8DEE9',
              fontFamily: 'monospace',
              fontSize: '1.1em',
              marginRight: '10px',
              padding: '5px',
              height: '100px'
            }}
            value={value}
            onChange={handleChange as any}
            onKeyPress={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                handleSubmit();
                event.preventDefault(); 
              }
            }}
          />
          <button style={buttonStyle} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5E81AC'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#434C5E'} onClick={handleSubmit}>
            🪄
          </button>
      </div>
    </div>
  );
};

export default Chat;
