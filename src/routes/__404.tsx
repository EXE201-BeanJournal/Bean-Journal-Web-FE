import { Link, createFileRoute } from '@tanstack/react-router';
import { Sprout, Search, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

const leafAnimateProps = [
  // Variant 1: More prominent, slightly larger leaves
  { top: '10%', left: '15%', size: 'w-20 h-20 md:w-28 md:h-28', y: -30, x: 15, rotate: -20, duration: 22, delay: 0, variant: 'primary' },
  { top: '25%', left: '80%', size: 'w-16 h-16 md:w-24 md:h-24', y: 35, x: -20, rotate: 15, duration: 28, delay: 2.5, variant: 'primary' },
  { top: '65%', left: '5%',  size: 'w-18 h-18 md:w-26 md:h-26', y: -35, x: 25, rotate: 25, duration: 20, delay: 1.5, variant: 'primary' },
  { top: '80%', left: '75%', size: 'w-14 h-14 md:w-20 md:h-20', y: 25, x: -10, rotate: -10, duration: 25, delay: 4, variant: 'primary' },
  
  // Variant 2: Slightly more subtle, different shade/size
  { top: '5%',  left: '50%', size: 'w-12 h-12 md:w-16 md:h-16', y: -20, x: 5,  rotate: 5,  duration: 30, delay: 0.5, variant: 'secondary' },
  { top: '40%', left: '25%', size: 'w-10 h-10 md:w-14 md:h-14', y: 20, x: -15, rotate: -12, duration: 32, delay: 3, variant: 'secondary' },
  { top: '50%', left: '60%', size: 'w-14 h-14 md:w-18 md:h-18', y: -25, x: 10, rotate: 18, duration: 26, delay: 1, variant: 'secondary' },
  { top: '90%', left: '30%', size: 'w-10 h-10 md:w-12 md:h-12', y: 15, x: -5,  rotate: -8, duration: 35, delay: 5, variant: 'secondary' },
];

const getLeafColorClass = (variant: string) => {
  if (variant === 'primary') {
    return 'text-green-500/30 dark:text-green-400/25'; // Increased opacity
  }
  return 'text-emerald-500/25 dark:text-emerald-400/20'; // Different shade, increased opacity
};

export function NotFoundPageContent() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-green-200 dark:from-gray-800 dark:to-green-700/50 p-6 font-publica-sans antialiased overflow-hidden">
      {/* Animated Background Leaves */}
      {leafAnimateProps.map((prop, index) => (
        <div
          key={index}
          className={`absolute ${getLeafColorClass(prop.variant)} pointer-events-none`}
          style={{ top: prop.top, left: prop.left }}
        >
          <Leaf className={prop.size} />
        </div>
      ))}

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg text-center space-y-8 bg-white dark:bg-gray-800/70 dark:text-gray-100 p-8 sm:p-12 rounded-2xl backdrop-blur-lg dark:backdrop-blur-xl border border-gray-200 dark:border-gray-700/50"
      >
        <motion.div
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="inline-block mb-4"
        >
          <Sprout className="w-24 h-24 text-[#99BC85] dark:text-[#b2d8a4]" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-7xl sm:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#85a673] to-[#99BC85] dark:from-[#a8d194] dark:to-[#c6e6b8] tracking-tight"
        >
          404
        </motion.h1>

        <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-gray-200">
          Oops! This Little Sprout Took a Detour!
        </h2>

        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
          It seems the page you're looking for has wandered off the path or hasn't quite sprouted yet. Don't worry, we can help you find your way back.
        </p>

        {/* Search Bar Placeholder */}
        <div className="relative w-full max-w-sm mx-auto">
          <input 
            type="search"
            placeholder="Search the journal..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#99BC85] focus:border-transparent outline-none transition-colors bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>

        <Link
          to="/journal"
          className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-[#99BC85] to-[#7aa761] hover:from-[#8AB073] hover:to-[#6f9857] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#E4EFE7] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
        >
          Back to Journal
        </Link>
      </motion.div>
    </div>
  );
}

// This makes it a route component that TanStack Router's Vite plugin can pick up.
// IMPORTANT: After this change, rename this file to __404.tsx in your src/routes directory.
export const Route = createFileRoute('/__404')({
  component: NotFoundPageContent,
});
