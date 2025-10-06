import React from "react";
import { useState, useEffect, useRef } from "react";
import { CiChat1 } from "react-icons/ci";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import { MdOutlineReplay } from "react-icons/md";
import ReactMarkdown from 'react-markdown';
import "./ChatBox.css";


const ChatBox = ({ userId, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const clearChat = async () => {
    try {
      const response = await fetch("http://localhost:8787/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId
        }),
      });

      if (response.ok) {
        setMessages([]);
      } else {
        console.error("Failed to clear chat history on server");
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue; // Store the message before clearing
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("https://spotify-ai-worker.gabekanjama.workers.dev/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          message: messageToSend,
          userData: {
            display_name: user?.display_name || 'there',
            profile_pic_url: user?.profile_pic_url
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed");
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: data.response || "No response from AI",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: `Error: ${error.message}`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen ? (
        <button className="chat-btn" onClick={() => setIsOpen(true)}>
          <CiChat1 />
        </button>
      ) : (
        <div className="chat-box">
          <div className="chat-header">
            <h2>Chat with THE AI OF DOOM</h2>
            <div className="header-buttons">
              <button className="clear-btn" onClick={clearChat} title="Clear chat">
                <MdOutlineReplay />
              </button>
              <button className="close-btn" onClick={() => setIsOpen(false)} title="Close chat">
                <IoMdCloseCircleOutline />
              </button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="welcome-message">
                Hey {user?.display_name || 'there'}! 👋 I can help you discover insights about your music listening habits. What would you like to know?
              </p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    {message.sender === 'ai' ? (
                      <ReactMarkdown
                        components={{
                          // Disable links for security
                          a: ({ children }) => <span>{children}</span>,
                          // Style headings appropriately for chat
                          h1: ({ children }) => <strong>{children}</strong>,
                          h2: ({ children }) => <strong>{children}</strong>,
                          h3: ({ children }) => <strong>{children}</strong>,
                          // Style lists
                          ul: ({ children }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>{children}</ol>,
                          // Style code blocks
                          code: ({ children }) => <code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>{children}</code>,
                        }}
                      >
                        {message.text}
                      </ReactMarkdown>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message ai loading">
                <div className="message-content">
                  <span className="typing-indicator">AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your music..."
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="send-btn"
            >
              <IoSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBox;
