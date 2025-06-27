import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import ChatMessage from "./ChatMessage";
import {
  Send,
  X,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2,
  BrainCircuit,
  Wrench,
  Settings,
  Headphones,
} from "lucide-react";
import FeedbackForm from "./FeedbackForm";
import { cn } from "@/lib/utils";
import FeatureDisplay from "./FeatureDisplay";
import PlansDisplay from "./PlansDisplay";
import PhilosophyDisplay from "./PhilosophyDisplay";
import ErrorBoundary from "./ErrorBoundary";

import { useSupportAgentConnection } from "@/hooks/use-support-agent-connection";
import {
  parseFinalAnswerPrompt,
  isPlanContent,
  isPhilosophyContent,
} from "./utils/responseParser";

interface Step {
  type: string;
  content: string;
}

interface Message {
  type: "user" | "bot" | "agent" | "system";
  content: string;
  steps?: Step[];
  timestamp?: Date;
  agentId?: string;
}

const ChatWidget: React.FC = () => {
  // Load messages from localStorage on initialization
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const savedMessages = localStorage.getItem('beanjournal_chat_messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        return parsed.map((msg: Message) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
      }
    } catch (error) {
      console.error('Error loading saved messages:', error);
    }
    return [{
      type: "bot",
      content: "Hello! I'm your Bean Journal assistant. How can I help you today?",
      timestamp: new Date(),
    }];
  });
  
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>(
    {}
  );

  const [showSupportOption, setShowSupportOption] = useState(false);
  const [isHumanSupportMode, setIsHumanSupportMode] = useState(false);
  const [showSessionEndDialog, setShowSessionEndDialog] = useState(false);

  // Support agent connection
  const {
    currentSession,
    messages: supportMessages,
    availableAgents,
    requestSupport,
    sendMessage: sendSupportMessage,
    endSession,
    isConnecting
  } = useSupportAgentConnection();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('beanjournal_chat_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages]);

  // Sync support messages with main messages when in human support mode
  useEffect(() => {
    if (isHumanSupportMode && supportMessages.length > 0) {
      const convertedSupportMessages: Message[] = supportMessages.map(
        (msg) => ({
          type: msg.sender as "user" | "agent" | "system",
          content: msg.content,
          timestamp: msg.timestamp,
          agentId: msg.agentId,
        })
      );

      // Only add new support messages that aren't already in the messages array
      setMessages((prev) => {
        const existingSupportCount = prev.filter(
          (m) => m.type === "agent" || m.type === "system"
        ).length;
        const newMessages = convertedSupportMessages.filter(
          (_, index) => index >= existingSupportCount
        );
        return [...prev, ...newMessages];
      });
    }
  }, [supportMessages, isHumanSupportMode]);

  // Handle session status changes
  useEffect(() => {
    if (currentSession?.status === "connected" && !isHumanSupportMode) {
      setIsHumanSupportMode(true);
      setShowSupportOption(false); // Hide support option when connected
      // Add system message about agent connection
      const systemMessage: Message = {
        type: "system",
        content: `You are now connected to a human support agent. They can see your previous conversation with the AI assistant.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    } else if (currentSession?.status === "ended" && isHumanSupportMode) {
      // Session ended by agent, show dialog for user choice
      setShowSessionEndDialog(true);
    }
  }, [currentSession, isHumanSupportMode]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = {
      type: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    // If in human support mode, send to support agent
    if (isHumanSupportMode && currentSession) {
      try {
        await sendSupportMessage(currentInput);
      } catch (error) {
        console.error("Error sending support message:", error);
        const errorMessage: Message = {
          type: "system",
          content: "Failed to send message to support agent. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
      return;
    }

    // Otherwise, send to AI
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3008/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        type: "bot",
        content: data.answer || "Sorry, I could not find an answer.",
        steps: data.steps,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (data.answer && data.answer.toLowerCase().includes("feedback")) {
        setShowFeedback(true);
      }

      // Show support option if AI can't help or user seems frustrated
      const needsSupport =
        data.answer &&
        (data.answer.toLowerCase().includes("sorry") ||
          data.answer.toLowerCase().includes("unable to") ||
          data.answer.toLowerCase().includes("cannot") ||
          data.answer.toLowerCase().includes("not sure"));

      if (needsSupport || messages.length >= 3) {
        setShowSupportOption(true);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      const errorMessage: Message = {
        type: "bot",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);
  const toggleMaximize = () => setIsMaximized(!isMaximized);
  const toggleSteps = (index: number) => {
    setExpandedSteps((prev) => ({ ...prev, [index]: !prev[index] }));
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
    <div
      className={`fixed z-50 bottom-5 right-5 ${isMaximized ? "w-[calc(100%-60%)] h-[calc(100%-40%)]" : "w-96 h-[600px]"} bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300`}
    >
      <header className="flex justify-between items-center p-4 bg-gray-50 border-b rounded-t-lg">
        <div className="flex items-center space-x-2">
          {isHumanSupportMode && currentSession?.agentImage ? (
            <img
              src={currentSession.agentImage}
              alt={currentSession.agentName || "Support Agent"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isHumanSupportMode ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg">
              {isHumanSupportMode ? (currentSession?.agentName || "Human Support") : "Bean Journal Assistant"}
            </h3>
            <p className="text-sm text-gray-500">
              {isHumanSupportMode ? (
                <span>
                  Connected to support agent
                </span>
              ) : (
                "Ask me anything about your journal"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHumanSupportMode && (
            <button
              onClick={() => setShowSessionEndDialog(true)}
              className="p-1 hover:bg-red-100 rounded text-red-600"
              title="End support session"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={toggleMaximize}
            className="text-gray-500 hover:text-gray-800"
            aria-label={isMaximized ? "Minimize chat" : "Maximize chat"}
          >
            {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button
            onClick={toggleChat}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isFeatureList =
            msg.type === "bot" &&
            msg.content.includes("Bean Journal has several great features:");

          // Parse finalAnswerPrompt if present
          const parsedResponse = parseFinalAnswerPrompt(msg.content);
          const contentToCheck = parsedResponse.success
            ? parsedResponse.content
            : msg.content;

          const isPlans = isPlanContent(contentToCheck);
          const isPhilosophy = isPhilosophyContent(contentToCheck);

          return (
            <div key={index}>
              {isFeatureList ? (
                <ErrorBoundary>
                  <FeatureDisplay featureText={msg.content} />
                </ErrorBoundary>
              ) : isPlans ? (
                <ErrorBoundary>
                  <PlansDisplay plansText={msg.content} />
                </ErrorBoundary>
              ) : isPhilosophy ? (
                <ErrorBoundary>
                  <PhilosophyDisplay philosophyText={msg.content} />
                </ErrorBoundary>
              ) : (
                <div className="mb-4">
                  {" "}
                  <ChatMessage
                    message={{
                      type: msg.type,
                      content: msg.content,
                      timestamp: msg.timestamp,
                      steps: msg.steps?.map((step) => ({
                        action: step.type,
                        result: step.content,
                      })),
                    }}
                    agentName={msg.type === 'agent' ? currentSession?.agentName : undefined}
                    agentImage={msg.type === 'agent' ? currentSession?.agentImage : undefined}
                  />{" "}
                </div>
              )}

              {msg.type === "bot" && msg.steps && msg.steps.length > 0 && (
                <div className="mt-2 ml-10">
                  <button
                    onClick={() => toggleSteps(index)}
                    className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700"
                  >
                    {expandedSteps[index] ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    Show AI Process
                  </button>
                  {expandedSteps[index] && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2 text-xs space-y-2 border border-gray-200">
                      <h4 className="font-semibold flex items-center gap-2 text-gray-700">
                        <BrainCircuit className="w-4 h-4 text-blue-600" />
                        AI Thought Process
                      </h4>
                      {msg.steps.map((step, stepIndex) => (
                        <div
                          key={stepIndex}
                          className={cn(
                            "pl-4 border-l-2 transition-all duration-200",
                            step.type === "thought"
                              ? "border-blue-200 bg-blue-50/50"
                              : step.type === "tool_name"
                                ? "border-purple-200 bg-purple-50/50"
                                : step.type === "tool_input"
                                  ? "border-green-200 bg-green-50/50"
                                  : step.type === "tool_output"
                                    ? "border-amber-200 bg-amber-50/50"
                                    : "border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {step.type === "tool_name" && (
                              <Wrench className="w-4 h-4 text-purple-600" />
                            )}
                            {step.type === "tool_input" && (
                              <Settings className="w-4 h-4 text-green-600" />
                            )}
                            <p className="font-medium text-gray-700">
                              {step.type
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
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
          );
        })}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-blue-600"></div>
            <p className="ml-2 text-gray-600">Bean is thinking...</p>
          </div>
        )}
        {isConnecting && (
          <div className="flex items-center justify-center p-4">
            <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-green-600"></div>
            <p className="ml-2 text-gray-600">Connecting to support agent...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t">
        <div className="space-y-2">
          {showSupportOption && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
              <div className="flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  Need more help? Talk to a real agent
                </span>
              </div>

              {/* Show online agents */}
              {availableAgents.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-blue-700">
                    Online agents ({availableAgents.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableAgents.slice(0, 3).map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs"
                      >
                        {agent.image ? (
                          <img
                            src={agent.image}
                            alt={agent.name}
                            className="w-3 h-3 rounded-full"
                          />
                        ) : (
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        )}
                        <span className="text-gray-700">{agent.name}</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    ))}
                    {availableAgents.length > 3 && (
                      <div className="text-xs text-blue-600">
                        +{availableAgents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  No agents currently online
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={async () => {
                    // Check if already connected or connecting
                    if (isConnecting || isHumanSupportMode || (currentSession && currentSession.status !== 'ended')) {
                      return;
                    }
                    
                    try {
                      // Prepare AI conversation history for the agent
                      const aiConversationHistory = messages
                        .filter(
                          (msg) => msg.type === "user" || msg.type === "bot"
                        )
                        .map((msg) => ({
                          type: msg.type as "user" | "bot",
                          content: msg.content,
                          timestamp: msg.timestamp,
                        }));

                      await requestSupport(undefined, aiConversationHistory);
                      // Don't hide support option immediately - let the connection state handle the UI
                    } catch (error) {
                      console.error("Error requesting support:", error);
                      const errorMessage: Message = {
                        type: "system",
                        content:
                          "Failed to connect to support. Please try again.",
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, errorMessage]);
                    }
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs px-2 py-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={availableAgents.length === 0 || isConnecting || (isHumanSupportMode && currentSession?.status === 'connected')}
                >
                  {isConnecting
                    ? "Connecting..."
                    : (isHumanSupportMode && currentSession?.status === 'connected')
                    ? "Already Connected"
                    : availableAgents.length > 0
                    ? "Connect"
                    : "No agents available"}
                </Button>
                <Button
                  onClick={async () => {
                    // If currently connecting, cancel the connection
                    if (isConnecting && currentSession?.status === 'waiting') {
                      await endSession();
                      const cancelMessage: Message = {
                        type: "system",
                        content: "Connection cancelled. You can try connecting again anytime.",
                        timestamp: new Date(),
                      };
                      setMessages((prev) => [...prev, cancelMessage]);
                    }
                    setShowSupportOption(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1"
                >
                  {isConnecting ? "Cancel" : "Dismiss"}
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder={isConnecting ? "Connecting to support..." : "Ask me anything..."}
              className="flex-1"
              disabled={isLoading || isConnecting}
              aria-label="Chat input"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || isConnecting}
              aria-label="Send message"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </footer>

      {showFeedback && (
        <FeedbackForm
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* Session End Dialog */}
      {showSessionEndDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              {currentSession?.agentImage ? (
                <img
                  src={currentSession.agentImage}
                  alt={currentSession.agentName || "Support Agent"}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {currentSession?.agentName?.charAt(0) || "A"}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">Session Ended</h3>
                <p className="text-sm text-gray-500">
                  {currentSession?.agentName || "Support Agent"}
                </p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Your support session with {currentSession?.agentName || "the support agent"} has ended. What would you like to do next?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  try {
                    await endSession();
                    setIsHumanSupportMode(false);
                    setShowSessionEndDialog(false);
                    // Keep existing messages and continue with AI
                  } catch (error) {
                    console.error("Error ending session:", error);
                  }
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue with AI Assistant
              </button>
              <button
                onClick={async () => {
                  try {
                    await endSession();
                    setIsHumanSupportMode(false);
                    setShowSessionEndDialog(false);
                    
                    // Clear messages and start fresh
                    setMessages([{
                      type: "bot",
                      content: "Hello! I'm your Bean Journal assistant. How can I help you today?",
                      timestamp: new Date(),
                    }]);
                    setInput("");
                  } catch (error) {
                    console.error("Error ending session:", error);
                  }
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Start New Chat
              </button>
              <button
                onClick={() => setShowSessionEndDialog(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
