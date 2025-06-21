import { Button } from "@/components/ui/Button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import LogoCloud from "@/components/logo-cloud";
import { ArrowRight } from "lucide-react";
// import headerImage from "@/images/bean-journal.png"; // Commenting out as it will be replaced
import ParallaxVideo from "@/components/parallax-video"; // Import the new component
import React from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react"; // Added import
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
  reverse = false,
}) => {
  const [contentWidth, setContentWidth] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const animationId = React.useMemo(
    () => `marquee-animation-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

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
              transform: translateX(${reverse ? `calc(-50% - ${contentWidth / 2}px)` : "0"});
            }
            100% {
              transform: translateX(${reverse ? "0" : `-${contentWidth}px`});
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
    <span
      className={`text-white font-bold mx-4 ${fontSize} uppercase tracking-wider inline-flex items-center gap-3`}
    >
      <span>BEANJOURNAL</span>
      <span className={`${fontSize} ml-[1.25rem]`} aria-hidden="true">
        •
      </span>
    </span>
  );

  // Create enough copies to ensure seamless scrolling
  const createContent = () => {
    // We need at least enough items to fill the container twice
    // to ensure the animation appears seamless
    return Array(50)
      .fill(0)
      .map((_, i) => <React.Fragment key={i}>{marqueeItem}</React.Fragment>);
  };

  return (
    <div
      className={`w-full overflow-hidden bg-gradient-to-r from-[#E4EFE7] to-[#B6D78A] ${thickness} relative`}
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

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  const { isSignedIn } = useAuth(); // Added to get auth state
  return (
    <>
      <main className="overflow-hidden">
        <section>
          <div className="relative pt-24 md:pt-36">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      delayChildren: 1,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    y: 20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      type: "spring" as const,
                      bounce: 0.3,
                      duration: 2,
                    },
                  },
                },
              }}
              className="absolute inset-0 -z-20"
            >
              <img
                src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
                alt="background"
                className="absolute inset-x-0 top-56 -z-20 hidden lg:top-32 dark:block"
                width="3276"
                height="4095"
              />
            </AnimatedGroup>
            <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"></div>
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0 relative z-10">
                <AnimatedGroup variants={transitionVariants}>
                  <a
                    href="#link"
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                  >
                    <span className="text-foreground text-sm font-publica-sans">
                      Introducing Support for AI Video Generation
                    </span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                </AnimatedGroup>

                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="z-10 mt-8 text-balance text-6xl font-publica-sans md:text-7xl lg:mt-16 xl:text-[5.25rem]"
                >
                  Your Journal, Amplified: AI Video & Productivity Tools
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg font-montserrat"
                >
                  Go beyond traditional journaling. Transform entries and images
                  into dynamic videos with AI, while seamlessly managing tasks
                  and tracking your progress. Elevate your personal reflection
                  and productivity.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-foreground/10 rounded-xl border p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <Link to={isSignedIn ? "/journal" : "/sign-in"}>
                        <span className="text-nowrap font-publica-sans">
                          Get Started
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-10.5 rounded-xl px-5"
                  >
                    <Link to="/pricing">
                      <span className="text-nowrap font-publica-sans">
                        View Pricing
                      </span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}
              className="flex flex-col items-center"
            >
              <div className="relative w-full -mt-32 md:w-[130%] md:-mt-[30rem] overflow-hidden px-2 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-transparent"
                />
                <div className="w-full max-w-xl mx-auto mt-32 -mb-16 md:max-w-[110rem] md:ml-[17rem] md:mt-[30rem] md:-mb-[12rem] ring-background dark:inset-shadow-white/20 bg-transparent relative overflow-hidden shadow-zinc-950/15 ring-1">
                  <div className="relative">
                    {/* <img
                      className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
                      src={headerImage}
                      alt="app screen"
                      width="2700"
                      height="1440"
                    /> */}
                    <ParallaxVideo
                      className="-z-50 aspect-15/8 relative dark:hidden"
                      alt="App screen parallax video"
                    />
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
          {/* Double infinite marquee lines */}
          <div className="relative w-[120%] z-30 mt-8 ml-[-10%] ">
            <InfiniteMarquee thickness="py-2" speed={40} fontSize="text-lg" />
          </div>

          <div className="relative w-[120%] z-20 -mt-1 ml-[-1%] rotate-[5deg] opacity-70">
            <InfiniteMarquee
              thickness="py-[0.4rem]"
              speed={30}
              fontSize="text-sm"
              reverse
            />
          </div>
        </section>
        <div className="mt-[2rem] mb-[2rem]">
          <LogoCloud />
        </div>
      </main>
    </>
  );
}
