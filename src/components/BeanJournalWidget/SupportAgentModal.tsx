import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useSupportAgentConnection, SupportMessage } from '@/hooks/use-support-agent-connection';
import { cn } from '@/lib/utils';

interface SupportAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConversationHistory?: Array<{
    type: 'user' | 'bot';
    content: string;
    timestamp?: Date;
  }>;
}

const SupportAgentModal: React.FC<SupportAgentModalProps> = ({ isOpen, onClose, aiConversationHistory = [] }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    currentSession,
    messages,
    availableAgents,
    isConnecting,
    requestSupport,
    sendMessage,
    endSession,
    clearSession
  } = useSupportAgentConnection();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentSession) return;
    
    await sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    if (currentSession && currentSession.status !== 'ended') {
      endSession();
    }
    onClose();
  };

  const getStatusIcon = () => {
    switch (currentSession?.status) {
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ended':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (currentSession?.status) {
      case 'waiting':
        return 'Waiting for agent...';
      case 'connected':
        return 'Connected to agent';
      case 'ended':
        return 'Session ended';
      default:
        return 'Ready to connect';
    }
  };

  const formatTime = (date: Date | string | number) => {
    try {
      const validDate = new Date(date);
      if (isNaN(validDate.getTime())) {
        return 'Invalid time';
      }
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(validDate);
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  const renderMessage = (message: SupportMessage) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    const isAgent = message.sender === 'agent';

    return (
      <div
        key={message.id}
        className={cn(
          'flex mb-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {/* Agent Avatar */}
        {isAgent && !isSystem && (
          <div className="flex-shrink-0 mr-2">
            {currentSession?.agentImage ? (
              <img 
                src={currentSession.agentImage} 
                alt={currentSession.agentName || 'Support Agent'}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-3 h-3 text-blue-600" />
              </div>
            )}
          </div>
        )}
        
        <div
          className={cn(
            'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-100 text-gray-600 text-center'
              : 'bg-gray-200 text-gray-800'
          )}
        >
          <p className="text-sm">{message.content}</p>
          <p className={cn(
            'text-xs mt-1',
            isUser ? 'text-blue-100' : 'text-gray-500'
          )}>
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            {currentSession?.status === 'connected' && currentSession.agentImage ? (
              <img 
                src={currentSession.agentImage} 
                alt={currentSession.agentName || 'Support Agent'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-blue-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {currentSession?.status === 'connected' && currentSession.agentName 
                  ? currentSession.agentName 
                  : 'Support Agent'
                }
              </h3>
              {currentSession?.status === 'connected' && (
                <p className="text-xs text-gray-500">Support Agent</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm text-gray-600">{getStatusText()}</span>
          </div>
          {availableAgents.length > 0 && (
            <span className="text-xs text-green-600">
              {availableAgents.length} agent{availableAgents.length !== 1 ? 's' : ''} online
            </span>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[300px] max-h-[400px]">
          {!currentSession ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Need help? Connect with one of our support agents.
              </p>
              <Button
                 onClick={() => {
                   const initialMessage = aiConversationHistory.length > 0 
                     ? 'User requesting human support after AI conversation'
                     : 'User requesting support';
                   
                   requestSupport(initialMessage, aiConversationHistory);
                 }}
                disabled={isConnecting || availableAgents.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? 'Connecting...' : 'Connect to Agent'}
              </Button>
              {availableAgents.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No agents are currently online. Please try again later.
                </p>
              )}
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        {currentSession && currentSession.status !== 'ended' && (
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={currentSession.status !== 'connected'}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || currentSession.status !== 'connected'}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {currentSession.status === 'waiting' && (
              <p className="text-xs text-gray-500 mt-2">
                Please wait while we connect you to an agent...
              </p>
            )}
          </div>
        )}

        {/* Session Ended Options */}
        {currentSession && currentSession.status === 'ended' && (
          <div className="p-4 border-t bg-gray-50">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-3">
                This session has ended. What would you like to do?
              </p>
              <div className="flex space-x-2 justify-center">
                <Button
                  onClick={() => {
                    clearSession();
                    requestSupport();
                  }}
                  disabled={availableAgents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Start New Session
                </Button>
                <Button
                  onClick={() => {
                    clearSession();
                    onClose();
                  }}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
              {availableAgents.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  No agents are currently online for new sessions.
                </p>
              )}
            </div>
          </div>
        )}

        {/* End Session Button */}
        {currentSession && currentSession.status === 'connected' && (
          <div className="p-4 border-t bg-gray-50">
            <Button
              onClick={endSession}
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              End Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportAgentModal;