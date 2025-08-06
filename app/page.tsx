// 'use client';

// import { useState } from 'react';

// export default function Home() {
//   const [input, setInput] = useState('');
//   const [chat, setChat] = useState<{ from: string; text: string }[]>([]);
//   const [loading, setLoading] = useState(false);

//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const userText = input;
//     setChat([...chat, { from: 'user', text: userText }]);
//     setInput('');
//     setLoading(true);

//     const res = await fetch('/api/chat', {
//       method: 'POST',
//       body: JSON.stringify({ userMessage: userText }),
//       headers: { 'Content-Type': 'application/json' },
//     });

//     const data = await res.json();
//     setChat((prev) => [...prev, { from: 'bot', text: data.response }]);
//     setLoading(false);
//   };

//   return (
//     <main className="max-w-xl mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">💬 Gemini Chatbot</h1>
//       <div className="bg-gray-100 h-96 overflow-y-scroll rounded p-3 mb-4">
//         {chat.map((msg, i) => (
//          <div key={i} className={`mb-2 text-${msg.from === 'user' ? 'right' : 'left'}`}>
//          <span
//            className={`inline-block px-3 py-2 rounded text-white ${
//              msg.from === 'user' ? 'bg-blue-600' : 'bg-green-600'
//            }`}
//          >
//            {msg.text}
//          </span>
//        </div>
//         ))}
//         {loading && <p className="text-gray-500">Thinking...</p>}
//       </div>

//       <div className="flex gap-2">
//         <input
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           className="flex-1 border px-3 py-2 rounded"
//           placeholder="Ask anything..."
//         />
//         <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded">
//           Send
//         </button>
//       </div>
//     </main>
//   );
// }

'use client';

import { useState } from 'react';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

interface Thread {
  id: string;
  title: string;
  messages: Message[];
  category?: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [currentThread, setCurrentThread] = useState<Thread>({
    id: Date.now().toString(),
    title: 'New Case',
    messages: [],
  });
  const [pastThreads, setPastThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPastCases, setShowPastCases] = useState(true);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    const updatedMessages = [...currentThread.messages, { from: 'user', text: userText }];
    
    // Update thread title if it's the first message
    const threadTitle = currentThread.messages.length === 0 
      ? userText.slice(0, 30) + (userText.length > 30 ? '...' : '')
      : currentThread.title;
    
    const updatedThread = { 
      ...currentThread, 
      messages: updatedMessages,
      title: threadTitle
    };
    
    setCurrentThread(updatedThread);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ userMessage: userText }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      const botMsg = { from: 'bot', text: data.response || 'Our backend team will get back to you on this shortly' };
      
      const newThread = {
        ...updatedThread,
        messages: [...updatedMessages, botMsg],
      };

      setCurrentThread(newThread);
      setLoading(false);

      // Update or insert into pastThreads
      setPastThreads((prev) => {
        const exists = prev.find((t) => t.id === newThread.id);
        if (exists) {
          return prev.map((t) => (t.id === newThread.id ? newThread : t));
        } else {
          return [newThread, ...prev];
        }
      });
    } catch (error) {
      console.error('API Error:', error);
      const botMsg = { from: 'bot', text: 'Our backend team will get back to you on this shortly' };
      const newThread = {
        ...updatedThread,
        messages: [...updatedMessages, botMsg],
      };

      setCurrentThread(newThread);
      setLoading(false);

      // Update pastThreads even on error
      setPastThreads((prev) => {
        const exists = prev.find((t) => t.id === newThread.id);
        if (exists) {
          return prev.map((t) => (t.id === newThread.id ? newThread : t));
        } else {
          return [newThread, ...prev];
        }
      });
    }
  };

  const startNewThread = () => {
    // Only start new thread if current thread has messages
    if (currentThread.messages.length === 0) return;
    
    setCurrentThread({ 
      id: Date.now().toString(), 
      title: 'New Case',
      messages: [] 
    });
  };

  const openPastThread = (thread: Thread) => {
    setCurrentThread(thread);
    setShowPastCases(false); // Collapse on mobile for better UX
  };

  const deleteThread = (threadId: string) => {
    setPastThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (currentThread.id === threadId) {
      setCurrentThread({ 
        id: Date.now().toString(), 
        title: 'New Case',
        messages: [] 
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Business Case Pro</h1>
          </div>
          
          <button
            onClick={startNewThread}
            className="w-full flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-3 rounded-lg transition-colors"
            title="Start a new conversation"
          >
            <span className="text-lg">+</span>
            <span className="font-medium">New Case</span>
          </button>
        </div>

        {/* Past Cases Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <button
              onClick={() => setShowPastCases(!showPastCases)}
              className="w-full flex items-center justify-between text-left text-gray-700 hover:text-gray-900 font-medium py-2"
            >
              <span>Past Cases {pastThreads.length > 0 && `(${pastThreads.length})`}</span>
              <span className={`transform transition-transform ${showPastCases ? 'rotate-90' : ''}`}>
                ➤
              </span>
            </button>
          </div>
          
          {showPastCases && (
            <div className="space-y-2 mb-6">
              {pastThreads.length > 0 ? (
                pastThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`group flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
                      currentThread.id === thread.id ? 'bg-purple-50 border border-purple-200' : 'border border-transparent'
                    }`}
                    onClick={() => openPastThread(thread)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {thread.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {thread.messages.length} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-500 transition-opacity"
                      title="Delete conversation"
                    >
                      <span className="text-sm">🗑️</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No past conversations yet</p>
                  <p className="text-gray-300 text-xs mt-1">Start a new case to see it here</p>
                </div>
              )}
            </div>
          )}

          {/* Category Items */}
          <div className="space-y-1 border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Categories
            </div>
            <div 
              className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-lg cursor-pointer text-gray-600 transition-colors"
              title="Performance analysis feature"
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-sm">Performance</span>
              <span className="text-xs text-gray-400 ml-auto">Upcoming</span>
            </div>
            
            <div 
              className="flex items-center gap-3 p-3 hover:bg-purple-50 rounded-lg cursor-pointer text-gray-600 transition-colors"
              title="Request new features"
            >
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-sm">Feature Request</span>
            </div>
          </div>
        </div>

        {/* Bottom User Section */}
        <div className="p-4 border-t border-gray-200">
          <div 
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            title="User profile"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm">👤</span>
            </div>
            <span className="text-sm text-gray-700 flex-1 font-medium">Saurabh</span>
            <span className="text-gray-400 text-sm hover:text-gray-600 cursor-pointer" title="Settings">
              ⚙️
            </span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {currentThread.messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">B</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">Business Case Pro</h2>
                <p className="text-gray-600">Start a new conversation to begin analyzing your business case</p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                    Market Analysis
                  </div>
                  <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                    Financial Planning
                  </div>
                  <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                    Risk Assessment
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {currentThread.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-4 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.from === 'bot' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">B</span>
                      </div>
                    )}
                    <div
                      className={`max-w-2xl p-4 rounded-2xl ${
                        msg.from === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    {msg.from === 'user' && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 text-sm">👤</span>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">B</span>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-2xl p-3 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border-none outline-none text-sm py-2 text-gray-900 placeholder-gray-500"
                disabled={loading}
              />
              
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <span className="text-white text-sm">➤</span>
              </button>
            </div>
            <div className="text-xs text-gray-400 text-center mt-2">
              Press Enter to send, Shift + Enter for new line
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}