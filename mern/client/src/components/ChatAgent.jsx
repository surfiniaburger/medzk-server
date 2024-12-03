/* eslint-disable react/prop-types */
import  { useState, useEffect } from 'react';

function ChatAgent({ patientId }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch initial messages if needed
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      setMessages([...messages, { user: message, bot: data.response }]);
      setMessage('');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Chat with Prediction</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>
            <strong>User:</strong> {msg.user}
            <br />
            <strong>Agent:</strong> {msg.bot}
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatAgent;
