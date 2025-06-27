import React from 'react';
import { Sparkles, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { parseFinalAnswerPrompt } from './utils/responseParser';
import { Plan, PlansDisplayProps } from './types';

const PlansDisplay: React.FC<PlansDisplayProps> = ({ plansText }) => {
  let plans: Plan[] = [];

  // Use utility function to parse finalAnswerPrompt
  const parsedResponse = parseFinalAnswerPrompt(plansText);
  
  if (parsedResponse.success) {
    const text = parsedResponse.content;
    
    // Check if it's a single plan format: "The [PlanName] plan costs [price] and includes the following features: [features]"
    const singlePlanMatch = text.match(/The (.+?) plan costs (.+?) and includes the following features: (.+)/);
    
    if (singlePlanMatch) {
      // Single plan format
      const name = singlePlanMatch[1].trim();
      const price = singlePlanMatch[2].trim();
      const featuresText = singlePlanMatch[3].trim();
      
      plans.push({
        name,
        price,
        features: featuresText.split(',').map((f: string) => f.trim()),
      });
    } else {
      // Multi-plan format with dashes
      const planRegex = /- ([^(]+)\(([^)]+)\): (.+?)(?=\n-|$)/gs;
      let match;
      
      while ((match = planRegex.exec(text)) !== null) {
        const name = match[1].trim();
        const price = match[2].trim();
        const featuresText = match[3].trim();
        
        plans.push({
          name,
          price,
          features: featuresText.split(',').map((f: string) => f.trim()),
        });
      }
    }
  } else {
    // If JSON parsing fails, try the regular text format
    plans = plansText
      .split('- ')
      .filter(Boolean)
      .map(planString => {
        const [namePart, featuresPart] = planString.split(': ');
        if (!namePart || !featuresPart) return null;

        const priceMatch = namePart.match(/\((.*?)\)/);
        const name = namePart.replace(/\(.*?\)/, '').trim();
        
        return {
          name,
          price: priceMatch ? priceMatch[1] : 'Free',
          features: featuresPart.split(',').map(f => f.trim()),
        };
      })
      .filter((p): p is Plan => p !== null);
  }

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 30
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
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
        duration: 0.4
      }
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3 mt-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 
        className="text-base font-semibold flex items-center gap-2 mb-3"
        variants={headerVariants}
      >
        <Sparkles className="w-4 h-4 text-purple-600" />
        Bean Journal Plans
      </motion.h3>
      <motion.div 
        className="grid grid-cols-1 gap-3"
        variants={containerVariants}
      >
        {plans.map((plan, index) => (
          <motion.div 
            key={index} 
            className="bg-white p-3 rounded-lg shadow-sm"
            variants={cardVariants}
          >
            <motion.div 
              className="flex items-center justify-between mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <motion.h4 
                className="font-semibold text-base"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                {plan.name}
              </motion.h4>
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ 
                  delay: 0.3 + index * 0.1,
                  type: "spring",
                  stiffness: 300
                }}
              >
                <Star className={`w-4 h-4 ${index === 1 ? 'text-yellow-500' : 'text-gray-400'}`} />
              </motion.div>
            </motion.div>
            <motion.p 
              className="text-xl font-bold text-purple-600 mb-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              {plan.price}
            </motion.p>
            <motion.ul 
              className="space-y-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              {plan.features.map((feature, featureIndex) => (
                <motion.li 
                  key={featureIndex} 
                  className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.6 + index * 0.1 + featureIndex * 0.05
                  }}
                >
                  <motion.span 
                    className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: 0.7 + index * 0.1 + featureIndex * 0.05,
                      type: "spring" as const
                    }}
                  ></motion.span>
                  <span className="flex-1">{feature}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
   );
};

export default PlansDisplay;