import { useState } from 'react';

export default function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '1rem', maxWidth: '600px' }}>
      <div style={{ height: '300px', overflowY: 'scroll', marginBottom: '1rem' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.from === 'assistant' ? 'left' : 'right', margin: '0.5rem 0' }}>
            <strong>{msg.from === 'assistant' ? 'Assistant' : 'You'}: </strong>{msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{ width: '80%', padding: '0.5rem' }}
      />
      <button onClick={handleSend} style={{ padding: '0.5rem 1rem' }}>Send</button>
    </div>
  );
}
