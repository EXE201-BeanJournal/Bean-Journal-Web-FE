import React from 'react';
import { User, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

// 1. Define the Message interface
interface Message {
  type: 'user' | 'bot';
  content: string;
}

// 2. Define props for the ChatMessage component
interface ChatMessageProps {
  message: Message;
}

// 3. Main ChatMessage component
const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.type === 'bot';

  // Check if the message content contains a list of features
  const isFeatureList = isBot && message.content.includes('\n- ');

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
  // 4. Determine if the message is from the user
  const isUser = message.type === 'user';

  // 5. Select the appropriate icon based on the message type
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
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 9. Render animated icon for bot messages */}
      {!isUser && (
        <motion.div 
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"
          variants={iconVariants}
          initial="hidden"
          animate="visible"
        >
          <Icon className="w-5 h-5 text-gray-600" />
        </motion.div>
      )}

      {/* 10. Render animated message content bubble */}
      <motion.div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-sm break-words ${isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
          }`}
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
      >
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