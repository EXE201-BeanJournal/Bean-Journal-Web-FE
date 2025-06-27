import React from 'react';
import { User, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

// 1. Define the Message interface
interface Message {
  type: 'user' | 'bot' | 'agent' | 'system';
  content: string;
  steps?: { action: string; result: string }[];
  timestamp?: Date;
  agentId?: string;
}

// 2. Define props for the ChatMessage component
interface ChatMessageProps {
  message: Message;
  agentName?: string;
  agentImage?: string;
}

// 3. Main ChatMessage component
const ChatMessage: React.FC<ChatMessageProps> = ({ message, agentName, agentImage }) => {
  const isBot = message.type === 'bot';
  const isAgent = message.type === 'agent';
  const isSystem = message.type === 'system';
  const isUser = message.type === 'user';

  // Check if the message content contains a list of features
  const isFeatureList = (isBot || isAgent) && message.content.includes('\n- ');

  const renderContent = () => {
    // Extract plain text from JSON if present
    let displayContent = message.content;
    try {
      const jsonContent = JSON.parse(message.content);
      if (jsonContent.finalAnswerPrompt) {
        displayContent = jsonContent.finalAnswerPrompt;
      }
    } catch (e) {
      // If parsing fails, use the content as is
    }

    if (isFeatureList) {
      const parts = displayContent.split('\n- ');
      const intro = parts[0];
      const features = parts.slice(1);

      return (
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {intro}
          </motion.p>
          <ul className="list-disc list-inside mt-2 space-y-2">
            {features.map((feature, index) => (
              <motion.li 
                key={index} 
                className="text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                {feature}
              </motion.li>
            ))}
          </ul>
        </div>
      );
    }
    
    // Split text into words for individual fade-in animation
    const words = displayContent.split(' ');
    return (
      <p>
        {words.map((word, index) => (
          <React.Fragment key={index}>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              className="inline-block"
            >
              {word}
            </motion.span>
            {index < words.length - 1 && ' '}
          </React.Fragment>
        ))}
      </p>
    );
  };
  // 4. Select the appropriate icon based on the message type
  const Icon = isUser ? User : Bot;

  // 6. Do not render a chat bubble if there is no content to display
  if (!message.content) {
    return null;
  }

  // 7. Animation variants for different message types
  const messageVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      x: isUser ? 20 : -20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4
      }
    }
  };

  const iconVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
      rotate: -180
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
        delay: 0.1
      }
    }
  };

  const bubbleVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        delay: 0.2
      }
    }
  };

  // 8. Main JSX for the chat message with animations
  return (
    <motion.div 
      className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 9. Render animated icon for bot messages */}
      {!isUser && (
        <motion.div 
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isBot ? 'bg-blue-100' : 
            isAgent ? 'bg-green-100' :
            isSystem ? 'bg-yellow-100' :
            'bg-gray-200'
          }`}
          variants={iconVariants}
          initial="hidden"
          animate="visible"
        >
          {isAgent && agentImage ? (
            <img
              src={agentImage}
              alt={agentName || "Support Agent"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : isAgent && agentName ? (
            <span className="text-white font-semibold text-sm">
              {agentName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Icon className={`w-5 h-5 ${
              isBot ? 'text-blue-600' :
              isAgent ? 'text-green-600' :
              isSystem ? 'text-yellow-600' :
              'text-gray-600'
            }`} />
          )}
        </motion.div>
      )}

      {/* 10. Render animated message content bubble */}
      <motion.div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-sm break-words ${
          isUser
            ? 'bg-blue-500 text-white ml-auto'
            : isAgent
            ? 'bg-green-100 text-green-800 border border-green-200'
            : isSystem
            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : 'bg-gray-100 text-gray-800'
        }`}
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Show agent name for agent messages */}
        {isAgent && (
          <div className="text-xs font-medium mb-1 text-green-600">
            {agentName || "Support Agent"}
          </div>
        )}
        {isSystem && (
          <div className="text-xs font-medium mb-1 text-yellow-600">
            System
          </div>
        )}
        {renderContent()}
      </motion.div>

      {/* 11. Render animated icon for user messages */}
      {isUser && (
        <motion.div 
          className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
          variants={iconVariants}
          initial="hidden"
          animate="visible"
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ChatMessage;