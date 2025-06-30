import { useRef, useEffect } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(TextPlugin);

const LoadingAnimation = () => {
  const loadingTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (loadingTextRef.current) {
      const texts = [
        "Analyzing your entries...",
        "Identifying key themes...",
        "Checking for emotional patterns...",
        "Crafting your summary...",
        "Almost there...",
      ];
      const masterTl = gsap.timeline({ repeat: -1 });

      texts.forEach((text) => {
        const tl = gsap.timeline({
          repeat: 1,
          yoyo: true,
          repeatDelay: 0.8,
        });
        tl.to(loadingTextRef.current, {
          duration: 1.5,
          text: text,
          ease: "none",
        });
        masterTl.add(tl);
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
      <p ref={loadingTextRef}></p>
    </div>
  );
};

export default LoadingAnimation; 