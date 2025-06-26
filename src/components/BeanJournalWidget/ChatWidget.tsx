import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import ChatMessage from './ChatMessage';
import { Send, X, MessageSquare, ChevronDown, ChevronUp, Minimize2, Maximize2, BrainCircuit, Wrench, Settings } from 'lucide-react';
import FeedbackForm from './FeedbackForm';
import { cn } from '@/lib/utils';
import FeatureDisplay from './FeatureDisplay';

interface Step {
  type: string;
  content: string;
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  steps?: Step[];
}

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3008/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        type: 'bot',
        content: data.answer || 'Sorry, I could not find an answer.',
        steps: data.steps,
      };

      setMessages(prev => [...prev, botMessage]);

      if (data.answer && data.answer.toLowerCase().includes('feedback')) {
        setShowFeedback(true);
      }

    } catch (error) {
      console.error('Error fetching response:', error);
      const errorMessage: Message = {
        type: 'bot',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);
  const toggleMaximize = () => setIsMaximized(!isMaximized);
  const toggleSteps = (index: number) => {
    setExpandedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
        aria-label="Open chat"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 bottom-5 right-5 ${isMaximized ? 'w-[calc(100%-60%)] h-[calc(100%-40%)]' : 'w-96 h-[600px]'} bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300`}>
      <header className="flex justify-between items-center p-4 bg-gray-50 border-b rounded-t-lg">
        <h3 className="font-bold text-lg">Bean Journal Assistant</h3>
        <div className="flex items-center gap-2">
          <button onClick={toggleMaximize} className="text-gray-500 hover:text-gray-800" aria-label={isMaximized ? 'Minimize chat' : 'Maximize chat'}>
            {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button onClick={toggleChat} className="text-gray-500 hover:text-gray-800" aria-label="Close chat">
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const toolStep = msg.steps?.find(step => step.type === 'tool_name');
          const outputStep = msg.steps?.find(step => step.type === 'tool_output');
          let featureData = null;

          if (toolStep?.content === 'getAllFeaturesTool' && outputStep) {
            try {
              featureData = JSON.parse(outputStep.content);
            } catch (e) {
              console.error("Failed to parse features", e);
            }
          }

          return (
            <div key={index}>
              <ChatMessage message={msg} />
              {featureData && 
                <div className="ml-10">
                  <FeatureDisplay data={featureData} />
                </div>
              }

            {msg.type === 'bot' && msg.steps && msg.steps.length > 0 && (
              <div className="mt-2 ml-10">
                <button onClick={() => toggleSteps(index)} className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700">
                  {expandedSteps[index] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Show AI Process
                </button>
                {expandedSteps[index] && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-2 text-xs space-y-2 border border-gray-200">
                    <h4 className="font-semibold flex items-center gap-2 text-gray-700">
                      <BrainCircuit className="w-4 h-4 text-blue-600" />
                      AI Thought Process
                    </h4>
                    {msg.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className={cn(
                        "pl-4 border-l-2 transition-all duration-200",
                        step.type === 'thought' ? 'border-blue-200 bg-blue-50/50' :
                        step.type === 'tool_name' ? 'border-purple-200 bg-purple-50/50' :
                        step.type === 'tool_input' ? 'border-green-200 bg-green-50/50' :
                        step.type === 'tool_output' ? 'border-amber-200 bg-amber-50/50' :
                        'border-gray-200'
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          {step.type === 'tool_name' && <Wrench className="w-4 h-4 text-purple-600" />}
                          {step.type === 'tool_input' && <Settings className="w-4 h-4 text-green-600" />}
                          <p className="font-medium text-gray-700">
                            {step.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                        <div className="text-gray-600 whitespace-pre-wrap font-mono bg-white/80 p-2 rounded mt-1 text-sm border border-gray-100">
                          {step.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )})}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-blue-600"></div>
            <p className="ml-2 text-gray-600">Bean is thinking...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {showFeedback && <FeedbackForm />}

      <footer className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <Button onClick={handleSend} disabled={isLoading} aria-label="Send message">
            <Send size={20} />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWidget;