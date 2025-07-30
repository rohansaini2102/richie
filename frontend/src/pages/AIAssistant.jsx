import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, AlertCircle, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AIAssistant = () => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [error, setError] = useState(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { advisor, isAuthenticated } = useAuth();

  // Fetch clients when component mounts
  useEffect(() => {
    fetchClients();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    
    // Check authentication
    if (!isAuthenticated) {
      setError('Please log in to access AI assistant');
      setLoadingClients(false);
      return;
    }
    
    try {
      const response = await api.get('/clients/ai-clients');
      const data = response.data;
      
      if (data.success) {
        setClients(data.data);
      } else {
        setError('Failed to fetch clients');
      }
    } catch (error) {
      setError('Error loading clients');
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setMessages([]);
    setError(null);
    setIsClientDropdownOpen(false);
    
    // Add welcome message
    setMessages([{
      id: Date.now(),
      role: 'ai',
      message: `Hello! I'm your AI financial assistant. I have access to ${client.name}'s complete financial profile and can help you provide targeted advice. What would you like to know about their financial situation?`,
      timestamp: new Date().toISOString()
    }]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedClient || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'advisor',
      message: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/clients/ai-chat', {
        clientId: selectedClient.id,
        message: inputMessage,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          message: msg.message
        }))
      });

      const data = response.data;

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'ai',
          message: data.data.response,
          timestamp: data.data.timestamp
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setError(data.message || 'Failed to get AI response');
      }
    } catch (error) {
      setError('Error communicating with AI assistant');
      console.error('Error sending message:', error);
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

  const clearConversation = () => {
    setMessages([]);
    setError(null);
    if (selectedClient) {
      setMessages([{
        id: Date.now(),
        role: 'ai',
        message: `Conversation cleared. I'm ready to help with ${selectedClient.name}'s financial questions.`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Financial Assistant</h1>
              <p className="text-sm text-gray-600">Get intelligent financial advice for your clients</p>
            </div>
          </div>
          
          {/* Client Selector */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Client
              </label>
              <button
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className="w-64 px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={loadingClients}
              >
                {loadingClients ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading clients...
                  </div>
                ) : selectedClient ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedClient.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Choose a client...</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {isClientDropdownOpen && !loadingClients && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {clients.length === 0 ? (
                    <div className="px-4 py-3 text-gray-500 text-sm">No clients found</div>
                  ) : (
                    clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={fetchClients}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh clients"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!selectedClient ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="h-24 w-24 mx-auto mb-6 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AI Financial Assistant</h2>
              <p className="text-gray-600 mb-4">Select a client from the dropdown above to start getting AI-powered financial advice</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <h3 className="font-medium text-blue-900 mb-2">What I can help with:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Portfolio analysis and recommendations</li>
                  <li>• Risk assessment and management</li>
                  <li>• Goal-based financial planning</li>
                  <li>• Investment strategy optimization</li>
                  <li>• Tax-efficient planning suggestions</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Client Info Bar */}
            <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-900">
                    Advising for: {selectedClient.name}
                  </span>
                  <span className="ml-2 text-sm text-orange-700">
                    ({selectedClient.email})
                  </span>
                </div>
                {messages.length > 1 && (
                  <button
                    onClick={clearConversation}
                    className="text-sm text-orange-700 hover:text-orange-900 font-medium"
                  >
                    Clear conversation
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">Start a conversation about {selectedClient.name}'s finances</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'advisor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-4xl`}>
                      {message.role === 'ai' && (
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Bot className="h-6 w-6 text-orange-600" />
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-lg ${
                          message.role === 'advisor'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</div>
                        <div className="text-xs mt-2 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {message.role === 'advisor' && (
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="bg-gray-100 px-4 py-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask about ${selectedClient.name}'s finances...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    rows="3"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;