/* eslint-disable react/prop-types */
import { useState } from 'react';
import axios from 'axios';
import { Loader2, Send } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const Chat = ({ threadId }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://medzk-server.onrender.com'
    : 'http://localhost:5050';

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE}/conversation/continue/${threadId}`, {
        message: message.trim()
      });

      setChatHistory(prev => [...prev, 
        { type: 'user', content: message },
        { type: 'assistant', content: response.data.response }
      ]);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="bg-background rounded-lg shadow-md p-4">
        <h2 className="text-2xl font-bold mb-4">Chat with AI Assistant</h2>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                  : 'bg-muted text-muted-foreground mr-auto max-w-[80%]'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-md"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;