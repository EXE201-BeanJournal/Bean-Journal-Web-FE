import React from 'react';
import { User, Bot } from 'lucide-react';

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
    if (isFeatureList) {
      const parts = message.content.split('\n- ');
      const intro = parts[0];
      const features = parts.slice(1);

      return (
        <div>
          <p>{intro}</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      );
    }
    return renderContent();
  };
  // 4. Determine if the message is from the user
  const isUser = message.type === 'user';

  // 5. Select the appropriate icon based on the message type
  const Icon = isUser ? User : Bot;

  // 6. Do not render a chat bubble if there is no content to display
  if (!message.content) {
    return null;
  }

  // 7. Main JSX for the chat message
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {/* 8. Render icon for bot messages */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
      )}

      {/* 9. Render message content bubble */}
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-sm break-words ${isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
          }`}
      >
        {message.content}
      </div>

      {/* 10. Render icon for user messages */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;