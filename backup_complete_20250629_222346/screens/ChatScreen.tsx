
import React, { useState, useRef, useEffect } from 'react';
import { MOCK_CHAT_MESSAGES, MOCK_USER_PROFILE } from '../constants';
import { ChatMessage } from '../types';
import Avatar from '../components/common/Avatar';
import { SendIcon, EmojiHappyIcon, PlusIcon, MoonIcon, SunIcon } from '../components/common/Icon';
import Button from '../components/common/Button';

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const message: ChatMessage = {
      id: `msg${messages.length + 1}`,
      senderId: MOCK_USER_PROFILE.id,
      text: newMessage.trim(),
      timestamp: new Date(),
      isCurrentUser: true,
    };
    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate a reply
    setTimeout(() => {
       const reply: ChatMessage = {
        id: `msg${messages.length + 2}`,
        senderId: 'user1', // Mock other user ID
        text: 'That sounds cool! Tell me more... 🤔',
        timestamp: new Date(),
        isCurrentUser: false,
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  const otherUser = { // Mock other user for avatar display
    avatarUrl: 'https://picsum.photos/seed/nova/100/100', 
    displayName: 'Nova'
  };

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? 'bg-dark-bg text-gray-200' : 'bg-gray-100 text-gray-800'} transition-colors duration-300`}>
      {/* Chat Header */}
      <header className={`p-3 border-b ${isDarkMode ? 'border-neon-blue/20 bg-dark-card' : 'border-gray-300 bg-white'} flex items-center space-x-3 shadow-md`}>
        <Avatar src={otherUser.avatarUrl} alt={otherUser.displayName} size="sm" />
        <div>
          <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-neon-blue' : 'text-blue-600'}`}>{otherUser.displayName}</h2>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Online</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-indigo-500" />}
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-end space-x-2 animate-fadeIn ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {!msg.isCurrentUser && <Avatar src={otherUser.avatarUrl} alt={otherUser.displayName} size="sm" className="self-end mb-1" />}
            <div 
              className={`max-w-[70%] p-3 rounded-xl shadow ${
                msg.isCurrentUser 
                ? (isDarkMode ? 'bg-neon-blue/80 text-black rounded-br-none' : 'bg-blue-500 text-white rounded-br-none')
                : (isDarkMode ? 'bg-dark-input text-gray-200 rounded-bl-none' : 'bg-gray-200 text-gray-800 rounded-bl-none')
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.isCurrentUser ? (isDarkMode ? 'text-gray-700' : 'text-blue-100') : (isDarkMode ? 'text-gray-500' : 'text-gray-500')} text-right`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.isCurrentUser && <Avatar src={MOCK_USER_PROFILE.avatarUrl} alt={MOCK_USER_PROFILE.displayName} size="sm" className="self-end mb-1"/>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <form onSubmit={handleSendMessage} className={`p-3 border-t ${isDarkMode ? 'border-neon-blue/20 bg-dark-card' : 'border-gray-300 bg-white'} flex items-center space-x-2 shadow-upwards`}>
        <Button variant="ghost" size="sm" type="button" className="p-2">
          <PlusIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400 hover:text-neon-blue' : 'text-gray-500 hover:text-blue-500'}`} />
        </Button>
        <Button variant="ghost" size="sm" type="button" className="p-2">
          <EmojiHappyIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400 hover:text-neon-blue' : 'text-gray-500 hover:text-blue-500'}`} />
        </Button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className={`flex-grow p-2.5 rounded-lg border ${isDarkMode ? 'bg-dark-input border-gray-700 focus:border-neon-blue text-gray-200 placeholder-gray-500' : 'bg-gray-100 border-gray-300 focus:border-blue-500 text-gray-800 placeholder-gray-400'} focus:ring-1 focus:ring-neon-blue outline-none transition-colors`}
        />
        <Button type="submit" variant="primary" size="sm" className="p-2.5" glowEffect="blue">
          <SendIcon className="w-5 h-5 text-black" />
        </Button>
      </form>

      {/* FAB for new conversation (conceptual - this screen is already a conversation) */}
      {/* <button className="absolute bottom-20 right-5 bg-neon-orange text-black p-4 rounded-full shadow-lg hover:scale-110 transition-transform">
        <PlusIcon className="w-6 h-6" />
      </button> */}
    </div>
  );
};

export default ChatScreen;
