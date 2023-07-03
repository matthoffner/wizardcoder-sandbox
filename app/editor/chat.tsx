import React, { useState, useRef, useEffect } from 'react';

type ChatProps = {
  onSubmit: (value: string) => void;
};

const Chat = ({ onSubmit }: ChatProps) => {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState([{ from: 'system', content: '🪄 Welcome to WizardCodeSandbox 🪄' }]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleSubmit = () => {
    setMessages([...messages, { from: 'user', content: value }]);
    onSubmit(value);
    setValue('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const buttonStyle = {
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
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
        <input
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
          }}
          value={value}
          onChange={handleChange}
          onKeyPress={event => {
            if (event.key === 'Enter') {
              handleSubmit();
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
