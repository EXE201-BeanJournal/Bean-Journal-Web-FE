"use client";
import React, { useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
  AnimatePresence
} from "framer-motion";
import { Sparkles, BarChart3, Shield, Activity, ChevronRight, Check, ChevronLeft, Calendar, Smile, Frown, Clock, BookOpen } from 'lucide-react';
import { ContainerTextFlip } from "./container-text-flip";
import gsap from "gsap";

// Text animation helper component
const AnimatedText = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  // Split text into an array of letters
  const letters = Array.from(text);
  
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * 0.1 },
    },
  };
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };
  
  return (
    <motion.span
      className={`inline-block overflow-visible ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block overflow-visible"
          variants={child}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Infinite marquee component
interface InfiniteMarqueeProps {
  thickness?: string;
  speed?: number;
  fontSize?: string;
  reverse?: boolean;
}

const InfiniteMarquee: React.FC<InfiniteMarqueeProps> = ({ 
  thickness = "py-2", 
  speed = 20, 
  fontSize = "text-lg",
  reverse = false
}) => {
  const [contentWidth, setContentWidth] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const animationId = React.useMemo(() => `marquee-animation-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Measure the width of the content
  React.useEffect(() => {
    const node = contentRef.current; // Store the current value

    if (node) {
      setContentWidth(node.offsetWidth);
    }
    
    // Add resize observer to remeasure if window resizes
    const resizeObserver = new ResizeObserver(() => {
      // Check current ref inside observer as it runs asynchronously
      if (contentRef.current) {
        setContentWidth(contentRef.current.offsetWidth);
      }
    });
    
    if (node) {
      resizeObserver.observe(node);
    }
    
    // Cleanup function uses the stored 'node' variable
    return () => {
      if (node) {
        resizeObserver.unobserve(node);
      }
    };
  }, []); // Empty dependency array ensures this runs on mount/unmount
  
  // Create dynamic style for marquee animation
  React.useEffect(() => {
    // Create and append keyframe animation dynamically
    if (contentWidth > 0) {
      const styleSheet = document.createElement("style");
      styleSheet.id = animationId;
      styleSheet.innerHTML = `
        @keyframes marquee-${animationId} {
          0% {
            transform: translateX(${reverse ? `calc(-50% - ${contentWidth / 2}px)` : '0'});
          }
          100% {
            transform: translateX(${reverse ? '0' : `-${contentWidth}px`});
          }
        }
        
        .marquee-animate-${animationId} {
          animation: marquee-${animationId} ${contentWidth > 0 ? speed : 0}s linear infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .marquee-animate-${animationId} {
            animation-play-state: paused;
          }
        }
      `;
      
      // Remove any existing marquee animation style with this ID
      const existingStyle = document.getElementById(animationId);
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Add the new style
      document.head.appendChild(styleSheet);
    }
    
    return () => {
      // Clean up the style element on unmount
      const styleElement = document.getElementById(animationId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [contentWidth, speed, reverse, animationId]);
  
  // Prepare the marquee items - "beanjournal" text with dot separators
  const marqueeItem = (
    <span className={`text-white font-bold mx-4 ${fontSize} uppercase tracking-wider inline-flex items-center gap-3`}>
      <span>BEANJOURNAL</span>
      <span className={`${fontSize} ml-[1.25rem]`} aria-hidden="true">•</span>
    </span>
  );
  
  // Create enough copies to ensure seamless scrolling
  const createContent = () => {
    // We need at least enough items to fill the container twice
    // to ensure the animation appears seamless
    return Array(50).fill(0).map((_, i) => (
      <React.Fragment key={i}>
        {marqueeItem}
      </React.Fragment>
    ));
  };
  
  return (
    <div 
      className={`w-full overflow-hidden bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A] ${thickness} relative`}
      ref={containerRef}
    >
      <div 
        className={`flex whitespace-nowrap marquee-animate-${animationId}`}
        ref={contentRef}
      >
        {createContent()}
      </div>
    </div>
  );
};

export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, -100]),
    springConfig
  );
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.15], [0.8, 0]);

  return (
    <div
      ref={ref}
      className="h-[190vh] py-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d] bg-gradient-to-b from-[#ffd1fb]/60 via-[#B6D78A] to-[#B6D78A]/20"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-indigo-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      <motion.div
        className="absolute inset-0 h-full w-full bg-[#ffd1fb]/10 z-10 pointer-events-none"
        style={{ opacity: overlayOpacity }}
      ></motion.div>
      
      <Header />
      
      {/* Double infinite marquee lines */}
      <div className="relative w-[120%] z-30 mt-8 ml-[-10%] ">
        <InfiniteMarquee 
          thickness="py-2" 
          speed={40}
          fontSize="text-lg"
        />
      </div>
      
      <div className="relative w-[120%] z-20 -mt-1 ml-[-1%] rotate-[5deg] opacity-70">
        <InfiniteMarquee 
          thickness="py-[0.4rem]" 
          speed={30}
          fontSize="text-sm"
          reverse
        />
      </div>
      
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="mt-40"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20 overflow-visible">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20 overflow-visible">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 overflow-visible">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  const [currentJournalPage, setCurrentJournalPage] = React.useState(0);
  const [isWriting, setIsWriting] = React.useState(false);
  const [typedTextLength, setTypedTextLength] = React.useState(0);
  const [cursorPosition, setCursorPosition] = React.useState<{top: number; left: number} | null>(null);
  const [moodValue, setMoodValue] = React.useState(75);
  const [promptIndex, setPromptIndex] = React.useState(0);

  const journalContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const typingRef = useRef<HTMLDivElement>(null);
  const cursorTargetRef = useRef<HTMLSpanElement>(null);
  const moodSliderRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const features = [
    { title: "AI-Powered Analysis", icon: <Activity className="h-5 w-5" /> },
    { title: "Daily Reflections", icon: <BarChart3 className="h-5 w-5" /> },
    { title: "Privacy First", icon: <Shield className="h-5 w-5" /> }
  ];

  // Prompts to cycle through
  const journalPrompts = [
    "What are you grateful for today?",
    "Describe a challenge you overcame this week.",
    "What brought you joy recently?",
    "Write about a goal you're working toward.",
    "Reflect on a meaningful conversation."
  ];

  // Journal entries for animation
  const journalEntries = [
    {
      date: "April 12, 2025",
      prompt: journalPrompts[0],
      content: "Today I'm grateful for the team's enthusiasm about our launch. Their energy keeps me motivated even when facing tight deadlines.",
      mood: 75,
      tags: ["work", "gratitude", "team"]
    },
    {
      date: "April 11, 2025",
      prompt: journalPrompts[1],
      content: "This week I struggled with balancing work priorities, but managed to delegate effectively and maintain focus on what matters most.",
      mood: 68,
      tags: ["challenge", "work", "growth"]
    },
    {
      date: "April 10, 2025",
      prompt: journalPrompts[2],
      content: "The morning walk in the park today was unexpectedly refreshing. Seeing the spring flowers bloom put me in a great mood for the day.",
      mood: 85,
      tags: ["nature", "joy", "mindfulness"]
    }
  ];

  // For typing animation - only updates length state
  useEffect(() => {
    let typingInterval: NodeJS.Timeout | null = null;
    // Reset length when page changes or writing starts
    setTypedTextLength(0); 

    if (isWriting) {
      const fullText = journalEntries[currentJournalPage].content;
      let i = 0;
      
      typingInterval = setInterval(() => {
        if (i < fullText.length) {
          setTypedTextLength(prev => prev + 1); // Increment length state
          i++;
        } else {
          if (typingInterval) clearInterval(typingInterval);
          setIsWriting(false); // Done writing
        }
      }, 50);

    } else {
      // If not writing initially, set full length for correct display
      setTypedTextLength(journalEntries[currentJournalPage]?.content?.length || 0);
    }

    // Cleanup function
    return () => {
      if (typingInterval) clearInterval(typingInterval);
    };
    // Rerun only when writing starts/stops or page changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWriting, currentJournalPage]); 

  // For cursor position measurement
  useEffect(() => {
    if (isWriting && cursorTargetRef.current && typingRef.current) {
      const targetRect = cursorTargetRef.current.getBoundingClientRect();
      const containerRect = typingRef.current.getBoundingClientRect();
      
      const top = targetRect.top - containerRect.top;
      const left = targetRect.left - containerRect.left;
      
      setCursorPosition({ top, left });
    } else {
      // Hide cursor when not writing
      setCursorPosition(null); 
    }
    // Rerun whenever the typed text length changes or writing state changes
  }, [typedTextLength, isWriting]); 

  // Journal page flip animation with GSAP
  useEffect(() => {
    if (pageRefs.current.length) {
      pageRefs.current.forEach((page, index) => {
        if (page) {
          gsap.set(page, {
            rotationY: index === currentJournalPage ? 0 : -90,
            opacity: index === currentJournalPage ? 1 : 0,
            zIndex: journalEntries.length - index
          });
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentJournalPage]);

  // Mood tracking animation
  useEffect(() => {
    if (moodSliderRef.current) {
      gsap.to(moodSliderRef.current, {
        width: `${moodValue}%`,
        duration: 1,
        ease: "power2.out"
      });
    }
  }, [moodValue]);

  // Init animations
  useEffect(() => {
    // Initialize page references array
    pageRefs.current = pageRefs.current.slice(0, journalEntries.length);
    
    // Removed GSAP timeline animation here - handled by Framer Motion below
    
    // Start writing animation for the initial page after a delay
    const timer = setTimeout(() => {
      setIsWriting(true);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial mount effect

  // Page navigation functions - simplified timing
  const nextPage = () => {
    if (currentJournalPage < journalEntries.length - 1) {
      setIsWriting(true);
      setCurrentJournalPage(prev => prev + 1);
      setMoodValue(journalEntries[currentJournalPage + 1].mood);
    }
  };

  const prevPage = () => {
    if (currentJournalPage > 0) {
      setIsWriting(true);
      setCurrentJournalPage(prev => prev - 1);
      setMoodValue(journalEntries[currentJournalPage - 1].mood);
    }
  };

  // Rotate journal prompts
  useEffect(() => {
    const promptInterval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % journalPrompts.length);
    }, 5000);
    
    return () => clearInterval(promptInterval);
  }, [journalPrompts.length]);

  return (
    <div className="max-w-7xl relative mx-auto py-20 md:py-32 px-4 w-full left-0 top-0 z-20 flex flex-col md:flex-row items-center gap-8 md:gap-16">
      <div className="flex-1 text-center md:text-left relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Sparkles className="mr-1 h-3 w-3" /> New AI Features Available
          </span>
        </motion.div>
        
        <div className="text-4xl md:text-7xl font-bold leading-relaxed mb-6 w-full overflow-visible">
          <ContainerTextFlip
            words={["Tracking", "Charting", "Evolving", "Learning", "Refining"]}
            className="bg-transparent shadow-none border-none h-[5rem] p-0 m-0 align-baseline text-inherit dark:text-inherit"
            textClassName="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A] p-0 m-0"
          />
          <AnimatedText text=" Your" delay={3} />
          <AnimatedText text=" Growth" delay={4} />
          <AnimatedText text=" Journey" delay={5} />
          <AnimatedText text=" with" delay={6} />
          <br />
          <div className="overflow-visible min-h-[1.2em]">
            <AnimatedText
              text="AI-Powered Insights"
              className="block mt-2 text-[3.7rem] text-transparent bg-clip-text bg-gradient-to-r from-[#ffd1fb] via-[#B6D78A] to-[#ffd1fb] pb-2 md:w-full"
              delay={7}
            />
          </div>
        </div>
        
        <motion.p 
          className="text-lg md:text-xl text-slate-900 dark:text-white mb-8 max-w-xl mx-auto md:mx-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Bean Journal combines the power of daily journaling with artificial intelligence to help you track patterns, set goals, and grow mindfully.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.button 
            className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A] text-white font-medium transition-all flex items-center justify-center hover:from-[#ffd1fb]/90 hover:to-[#B6D78A]/90 shadow-lg shadow-indigo-500/20"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started Free <ChevronRight className="ml-2 h-4 w-4" />
          </motion.button>
          <motion.button 
            className="px-8 py-3 rounded-lg border border-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-all hover:bg-slate-800/50"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            View Demo
          </motion.button>
        </motion.div>
        
        <motion.div 
          className="flex flex-wrap gap-y-3 gap-x-6 justify-center md:justify-start text-sm text-slate-700 dark:text-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A] flex items-center justify-center mr-2">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span>{feature.title}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Interactive Journal Experience */}
      <motion.div
        className="flex-1 relative h-[500px] max-w-lg mx-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        ref={journalContainerRef}
      >
        <div className="relative w-full h-full">
          {/* Journal Book - Removed initial rotation */}
          <motion.div 
            className="relative w-full h-full"
          >
            {/* Journal Cover - Removed rotation animation and 3D styles */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#ffd1fb] to-[#B6D78A] rounded-lg shadow-xl border-t border-l border-indigo-700 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#B6D78A]/40 to-transparent"></div>
              
              {/* Cover Design */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[80%]">
                <motion.div 
                  className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A] pb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  Bean Journal
                </motion.div>
                <motion.div 
                  className="w-12 h-1 mx-auto bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A] rounded-full my-4"
                  initial={{ width: 0 }}
                  animate={{ width: 48 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                />
                <motion.div 
                  className="text-sm text-slate-700 dark:text-indigo-300/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                >
                  Your journey to mindful growth
                </motion.div>
              </div>

              {/* Bookmark */}
              <motion.div
                className="absolute -right-1 top-10 h-20 w-8 bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A] rounded-l-md shadow-md"
                initial={{ x: 20 }}
                animate={{ x: 0 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
              />
            </motion.div>

            {/* Create a container for pages - Removed 3D styles */}
            <div 
              className="absolute inset-0 m-3" 
            >
              {/* Journal Pages - Fade Transition */}
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={`page-${currentJournalPage}`}
                  className="absolute inset-0 bg-slate-100/95 dark:bg-slate-800/95 rounded-md p-6 pb-12 shadow-inner"
                  variants={{
                    enter: {
                      opacity: 1,
                      transition: {
                        duration: 0.4, // Faster fade in
                        ease: "easeOut"
                      }
                    },
                    initial: {
                      opacity: 0,
                    },
                    exit: {
                      opacity: 0,
                      transition: {
                        duration: 0.3, // Faster fade out
                        ease: "easeIn"
                      }
                    }
                  }}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                  ref={(el) => {
                    if (pageRefs.current) {
                      pageRefs.current[currentJournalPage] = el;
                    }
                  }}
                >
                  {/* Page Header */}
                  <div className="flex justify-between items-center mb-4 border-b border-slate-300/30 pb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-indigo-500 mr-2" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">{journalEntries[currentJournalPage].date}</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      {journalEntries[currentJournalPage].tags.map((tag, tagIndex) => (
                        <span 
                          key={`tag-${currentJournalPage}-${tagIndex}`} 
                          className="text-xs px-2 py-0.5 rounded-full bg-[#ffd1fb]/30 dark:bg-[#ffd1fb]/20 text-pink-800 dark:text-pink-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Prompt */}
                  <div className="bg-slate-200/50 dark:bg-slate-700/20 p-3 rounded-md mb-4 flex items-start">
                    <div className="mr-2 mt-1 p-1 bg-indigo-100 dark:bg-indigo-900/40 rounded">
                      <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">{journalEntries[currentJournalPage].prompt}</p>
                  </div>
                  
                  {/* Journal Content - Render text based on state */}
                  <div className="min-h-[150px] mb-4 relative">
                    <div 
                      ref={typingRef} // Ref is now on the container
                      className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap"
                    >
                      {/* Render typed text */} 
                      <span>{journalEntries[currentJournalPage].content.substring(0, typedTextLength)}</span>
                      {/* Empty span for cursor measurement */} 
                      <span ref={cursorTargetRef} className="inline-block w-0"></span> {/* Ensure span takes space */}
                    </div>
                    
                    {/* Cursor - position based on measurement state */}
                    {isWriting && cursorPosition && (
                      <motion.div 
                        className="absolute inline-block w-0.5 h-4 bg-indigo-500"
                        key={`cursor-${currentJournalPage}`} 
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ 
                          // Use direct top/left positioning with vertical adjustment
                          position: 'absolute',
                          top: (cursorPosition.top - 13) + 'px', // Nudge up by 13px
                          left: (cursorPosition.left + 2) + 'px', // Nudge right by 4px
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Mood Tracker */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <div className="flex items-center">
                        <Frown className="w-3 h-3 mr-1" />
                        <span>Mood</span>
                      </div>
                      <div className="flex items-center">
                        <span>Feeling Good</span>
                        <Smile className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        ref={moodSliderRef}
                        className="h-full bg-gradient-to-r from-[#ffd1fb] to-[#B6D78A]"
                        initial={{ width: `${moodValue}%` }} 
                        animate={{ width: `${moodValue}%` }} 
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  
                  {/* AI Insights Section */}
                  <motion.div 
                    className="bg-gradient-to-r from-[#ffd1fb]/90 to-[#B6D78A]/90 p-3 rounded-md mt-6 text-slate-900"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 rounded-full bg-[#B6D78A]/30 flex items-center justify-center mr-2">
                    <Sparkles className="h-3 w-3 text-green-800" />
                  </div>
                      <p className="text-xs font-medium">AI Insight:</p>
                </div>
                    <p className="text-xs text-slate-800">
                      {/* Display insight based on current page */}
                      {currentJournalPage === 0 ? "Your emotional awareness is improving. Try reflecting on what specific aspects of teamwork energize you the most." :
                       currentJournalPage === 1 ? "You're developing stronger prioritization skills. Consider documenting your successful delegation strategies." :
                       "Nature seems to have a significant positive impact on your mood. Perhaps schedule more outdoor activities?"}
                    </p>
                  </motion.div>
                  
                  {/* Page Number */}
                  <div className="absolute bottom-2 right-4 text-xs text-slate-400">
                    {currentJournalPage + 1} / {journalEntries.length}
              </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>

          {/* Page Turn Controls */}
          <motion.div 
            className="absolute top-1/2 -left-5 z-50"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: currentJournalPage > 0 ? 1 : 0.3, x: 0 }}
            transition={{ delay: 1 }}
          >
            <motion.button
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center border border-indigo-500/20 shadow-lg"
              onClick={prevPage}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.95 }}
              disabled={currentJournalPage === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
          </motion.div>

          <motion.div 
            className="absolute top-1/2 -right-5 z-50"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: currentJournalPage < journalEntries.length - 1 ? 1 : 0.3, x: 0 }}
            transition={{ delay: 1 }}
          >
                <motion.button
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center border border-indigo-500/20 shadow-lg"
              onClick={nextPage}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.95 }}
              disabled={currentJournalPage === journalEntries.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </motion.div>

          {/* Repositioned Tomorrow's Prompt outside the Journal component */}
          <motion.div
            layout
            className="absolute -top-10 right-0 bg-gradient-to-r from-[#ffd1fb]/80 to-[#B6D78A]/80 backdrop-blur-md p-3 rounded-lg shadow-lg border border-indigo-500/20 max-w-[250px]"
            initial={{ opacity: 0, y: 10, rotateZ: 5 }}
            animate={{ opacity: 1, y: 0, rotateZ: 0 }}
            transition={{ 
              delay: 2, 
              duration: 0.5, 
              layout: {
                duration: 0.35,
                ease: [0.34, 1.56, 0.64, 1], // Spring-like cubic bezier curve similar to Apple's animations
                type: "tween"
              }
            }}
            style={{ zIndex: 50 }}
          >
            <div className="flex mb-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ffd1fb]/20 to-[#B6D78A]/20 flex items-center justify-center mr-2 border border-purple-500/20">
                <BookOpen className="h-3 w-3 text-purple-300" />
              </div>
              <p className="text-xs font-medium text-slate-900">Tomorrow's Prompt:</p>
            </div>
            <AnimatePresence mode="wait">
              <motion.p 
                layout
                key={`prompt-${promptIndex}`}
                className="text-xs text-slate-800"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.5,
                  layout: {
                    duration: 0.35,
                    ease: [0.34, 1.56, 0.64, 1], // Same spring-like curve for content
                    type: "tween"
                  }
                }}
              >
                {journalPrompts[promptIndex]}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Timeline of past entries - Use Framer Motion stagger */}
          <motion.div
            className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30"
            ref={timelineRef}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  delay: 1.5, // Delay the whole group
                  staggerChildren: 0.1 // Stagger individual items
                }
              }
            }}
          >
            {journalEntries.map((_, index) => (
              <motion.button
                key={`timeline-${index}`}
                className={`timeline-item h-2 rounded-full transition-all duration-300 ease-in-out ${index === currentJournalPage ? 'bg-indigo-500 w-12' : 'bg-slate-700 w-6'}`}
                onClick={() => {
                  // Prevent changing to the same page
                  if (index !== currentJournalPage) { 
                    setCurrentJournalPage(index);
                    setIsWriting(true); // Trigger writing animation
                    setMoodValue(journalEntries[index].mood);
                  }
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                // Removed initial/animate here, handled by parent stagger
              />
            ))}
          </motion.div>

          {/* Daily Streak Indicator */}
          <motion.div
            className="absolute -bottom-10 -left-4 bg-gradient-to-r from-[#ffd1fb]/80 to-[#B6D78A]/80 backdrop-blur-md p-3 rounded-lg shadow-lg border border-blue-500/20"
            initial={{ opacity: 0, y: 10, rotateZ: -5 }}
            animate={{ opacity: 1, y: 0, rotateZ: 0 }}
            transition={{ delay: 2.2, duration: 0.5 }}
          >
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ffd1fb]/20 to-[#B6D78A]/20 flex items-center justify-center mr-2 border border-blue-500/20">
                <Clock className="h-3 w-3 text-pink-800" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900">7-Day Streak</p>
                <div className="flex space-x-1 mt-1">
                  {Array(7).fill(0).map((_, i) => (
                    <motion.div 
                      key={`streak-${i}`}
                      className={`h-1 rounded-full ${i < 5 ? 'bg-green-600' : 'bg-slate-600'}`}
                      style={{ width: i === 6 ? 6 : 4 }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 2.4 + i * 0.1, duration: 0.4 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute -z-10 -bottom-10 right-0 w-64 h-64 bg-indigo-600 rounded-full opacity-10 blur-[80px]"></div>
          <div className="absolute -z-10 top-0 -left-20 w-80 h-80 bg-blue-600 rounded-full opacity-10 blur-[100px]"></div>
        </div>
      </motion.div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
        scale: 1.05,
        transition: { duration: 0.3 }
      }}
      key={product.title}
      className="group/product h-96 w-[30rem] relative shrink-0 rounded-xl overflow-hidden shadow-xl"
    >
      <img
        src={product.thumbnail}
        height={600}
        width={600}
        className="object-cover object-left-top absolute h-full w-full inset-0 transition-transform duration-500 group-hover/product:scale-110"
        alt={product.title}
      />
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-gradient-to-t from-[#ffd1fb] via-[#B6D78A]/80 to-transparent transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 p-6 transform translate-y-4 opacity-0 group-hover/product:opacity-100 group-hover/product:translate-y-0 transition-all duration-300">
        <h2 className="text-2xl font-bold text-white mb-2">
          {product.title}
        </h2>
        <div className="flex items-center">
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            View Details
          </span>
        </div>
      </div>
    </motion.div>
  );
};
