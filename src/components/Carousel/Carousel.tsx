import {
  useEffect,
  useState,
  useRef,
  Children,
  ReactNode,
  JSX,
  useMemo,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  Transition,
  MotionValue,
  AnimatePresence,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// replace icons with your own if needed

export interface CarouselProps {
  children: ReactNode;
  carouselWidth?: number | string;
  itemWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

const GAP = 16;
const SPRING_OPTIONS: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const CarouselSlide = ({
  x,
  trackItemOffset,
  index,
  item,
  itemWidth,
  round,
  effectiveTransition,
  containerWidth,
}: {
  x: MotionValue<number>;
  trackItemOffset: number;
  index: number;
  item: ReactNode;
  itemWidth: number;
  round: boolean;
  effectiveTransition: Transition;
  containerWidth: number;
}) => {
  const centerPoint = (containerWidth - itemWidth) / 2;
  const itemCenterInTrackX = centerPoint - index * trackItemOffset;

  const range = [
    itemCenterInTrackX + trackItemOffset,
    itemCenterInTrackX,
    itemCenterInTrackX - trackItemOffset,
  ];

  const scale = useTransform(x, range, [0.85, 1, 0.85], { clamp: true });

  return (
    <motion.div
      className={`relative shrink-0 flex ${
        round
          ? "items-center justify-center text-center bg-[#060010] border-0"
          : ""
      } overflow-hidden`}
      style={{
        width: itemWidth,
        height: round ? itemWidth : "auto",
        scale,
        ...(round && { borderRadius: "50%" }),
      }}
      transition={effectiveTransition}
    >
      {item}
    </motion.div>
  );
};

export default function Carousel({
  children,
  carouselWidth = "100%",
  itemWidth = 212,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  round = false,
}: CarouselProps): JSX.Element {
  const trackItemOffset = itemWidth + GAP;

  const childrenArray = Children.toArray(children);
  const itemsCount = childrenArray.length;

  const carouselItems = useMemo(() => {
    if (loop && itemsCount > 1) {
      return [
        childrenArray[itemsCount - 1],
        ...childrenArray,
        childrenArray[0],
      ];
    }
    return childrenArray;
  }, [childrenArray, itemsCount, loop]);

  const [currentIndex, setCurrentIndex] = useState<number>(
    loop && itemsCount > 1 ? 1 : 0,
  );
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (autoplay && (!pauseOnHover || !isHovered)) {
      const timer = setInterval(() => {
        if (loop) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setCurrentIndex((prev) =>
            prev === itemsCount - 1 ? 0 : prev + 1,
          );
        }
      }, autoplayDelay);
      return () => clearInterval(timer);
    }
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, loop, itemsCount]);

  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (isResetting) {
      setIsResetting(false);
    }
    if (loop && itemsCount > 1) {
      if (currentIndex === 0) {
        setIsResetting(true);
        setCurrentIndex(itemsCount);
      } else if (currentIndex === itemsCount + 1) {
        setIsResetting(true);
        setCurrentIndex(1);
      }
    }
  };

  const handleNext = () => {
    if (loop) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, itemsCount - 1));
    }
  };
  const handlePrev = () => {
    if (loop) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const centerPoint = (containerWidth - itemWidth) / 2;

  const widthStyle =
    typeof carouselWidth === "string" ? carouselWidth : `${carouselWidth}px`;
  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        width: widthStyle,
        height: round ? `${itemWidth}px` : "auto",
        ...(round && { borderRadius: "50%" }),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="flex"
        style={{
          x,
          gap: `${GAP}px`,
        }}
        animate={{ x: centerPoint - currentIndex * trackItemOffset }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((item, index) => {
          return (
            <CarouselSlide
              key={index}
              x={x}
              trackItemOffset={trackItemOffset}
              index={index}
              item={item}
              itemWidth={itemWidth}
              round={round || false}
              effectiveTransition={effectiveTransition}
              containerWidth={containerWidth}
            />
          );
        })}
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <>
            {(loop || currentIndex > 0) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 dark:bg-black/50 backdrop-blur-sm p-1 rounded-full text-gray-800 dark:text-white hover:bg-white/80 dark:hover:bg-black/80 z-10 shadow-md"
              >
                <ChevronLeft size={24} />
              </motion.button>
            )}
            {(loop || currentIndex < itemsCount - 1) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 dark:bg-black/50 backdrop-blur-sm p-1 rounded-full text-gray-800 dark:text-white hover:bg-white/80 dark:hover:bg-black/80 z-10 shadow-md"
              >
                <ChevronRight size={24} />
              </motion.button>
            )}
          </>
        )}
      </AnimatePresence>

      <div
        className={`flex w-full justify-center ${
          round ? "absolute z-20 bottom-12 left-1/2 -translate-x-1/2" : ""
        }`}
      >
        <div className="mt-4 flex w-fit justify-center space-x-2">
          {childrenArray.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 w-2 rounded-full cursor-pointer transition-colors duration-150 ${
                (loop
                  ? (currentIndex === 0
                    ? itemsCount - 1
                    : currentIndex === itemsCount + 1
                    ? 0
                    : currentIndex - 1)
                  : currentIndex) === index
                  ? round
                    ? "bg-white"
                    : "bg-[#333333]"
                  : round
                  ? "bg-[#555]"
                  : "bg-[rgba(51,51,51,0.4)]"
              }`}
              animate={{
                scale:
                  (loop
                    ? (currentIndex === 0
                      ? itemsCount - 1
                      : currentIndex === itemsCount + 1
                      ? 0
                      : currentIndex - 1)
                    : currentIndex) === index
                    ? 1.2
                    : 1,
              }}
              onClick={() =>
                setCurrentIndex(loop && itemsCount > 1 ? index + 1 : index)
              }
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
