import React from 'react';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureDisplayProps {
  featureText: string;
}

const FeatureDisplay: React.FC<FeatureDisplayProps> = ({ featureText }) => {
  let cleanText = featureText;

  // Attempt to parse JSON and extract finalAnswerPrompt
  try {
    const parsed = JSON.parse(featureText);
    if (parsed.finalAnswerPrompt) {
      cleanText = parsed.finalAnswerPrompt;
    }
  } catch (error) {
    // Not a JSON string, use as is
  }

  const lines = cleanText.split('\n- ').filter(line => line.trim() !== '');
  const title = lines[0];
  const features = lines.slice(1).map(line => {
    const [featureName, ...descriptionParts] = line.split(': ');
    return {
      name: featureName.trim(),
      description: descriptionParts.join(': ').trim(),
    };
  });

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
        ease: "easeOut" as const,
        staggerChildren: 0.1
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

  const gridVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const featureVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        type: "spring" as const,
        stiffness: 300
      }
    }
  };

  const iconVariants = {
    hidden: {
      scale: 0,
      rotate: -180
    },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        delay: 0.2
      }
    }
  };

  return (
    <motion.div 
      className="bg-gray-50 rounded-lg p-4 mt-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 
        className="text-lg font-semibold flex items-center gap-2"
        variants={headerVariants}
      >
        {title}
      </motion.h3>
      <motion.div 
        className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={gridVariants}
      >
        {features.map((feature, index) => (
          <motion.div 
            key={index} 
            className="bg-white p-3 rounded shadow-sm flex items-start gap-3"
            variants={featureVariants}
          >
            <motion.div variants={iconVariants}>
              <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
            >
              <motion.p 
                className="font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
              >
                {feature.name.split(' ').map((word, wordIndex) => (
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.5 + index * 0.1 + wordIndex * 0.03 }}
                    style={{ display: 'inline-block', marginRight: '0.25rem' }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.p>
              <motion.p 
                className="text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
              >
                {feature.description.split(' ').map((word, wordIndex) => (
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.7 + index * 0.1 + wordIndex * 0.02 }}
                    style={{ display: 'inline-block', marginRight: '0.25rem' }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default FeatureDisplay;