import React from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseFinalAnswerPrompt } from './utils/responseParser';

interface PhilosophyDisplayProps {
  philosophyText: string;
}

const PhilosophyDisplay: React.FC<PhilosophyDisplayProps> = ({ philosophyText }) => {
  // Use utility function to parse finalAnswerPrompt
  const parsedResponse = parseFinalAnswerPrompt(philosophyText);
  const displayText = parsedResponse.success ? parsedResponse.content : philosophyText;

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  const headerVariants = {
    hidden: {
      opacity: 0,
      x: -20
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: 0.1
      }
    }
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: 0.3
      }
    }
  };

  const textVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: 0.5
      }
    }
  };

  return (
    <motion.div 
      className="bg-green-50 rounded-lg p-4 mt-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 
        className="text-lg font-semibold flex items-center gap-2"
        variants={headerVariants}
      >
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ 
            delay: 0.2,
            type: "spring",
            stiffness: 300
          }}
        >
          <BookOpen className="w-5 h-5 text-green-600" />
        </motion.div>
        Our Philosophy
      </motion.h3>
      <motion.div 
        className="mt-4"
        variants={contentVariants}
      >
        <motion.div 
          className="bg-white p-4 rounded-lg shadow-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <motion.p 
            className="text-gray-700 leading-relaxed"
            variants={textVariants}
          >
            {displayText.split(' ').map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.03 }}
                style={{ display: 'inline-block', marginRight: '0.25rem' }}
              >
                {word}
              </motion.span>
            ))}
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default PhilosophyDisplay;