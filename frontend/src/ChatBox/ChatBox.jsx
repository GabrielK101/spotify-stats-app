import React from "react";
import { useState, useEffect, useRef } from "react";
import { CiChat1 } from "react-icons/ci";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import "./ChatBox.css";


const ChatBox = () => {
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

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8787/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test_user", // replace with logged-in user later
          message: inputValue,
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
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <IoMdCloseCircleOutline />
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="welcome-message">How can I help you with your music insights today?</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    {message.text}
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
