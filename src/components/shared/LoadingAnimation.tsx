import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import beanLogo from '../../images/logo_bean_journal.png';
// import './LoadingAnimation.css';

const LoadingAnimation: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const text = "Bean Journal";

    useEffect(() => {
        if (!containerRef.current) return;

        const loaderLogo = ".loader-logo";
        const loaderChars = ".loader-text span";

        const ctx = gsap.context(() => {
            gsap.set(loaderLogo, { autoAlpha: 0, scale: 0 });
            gsap.set(loaderChars, { autoAlpha: 0, y: 25 }); // Initial state for the wave

            const tl = gsap.timeline();

            tl.to(loaderLogo, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.8,
                ease: "back.out(1.7)",
            }).to(
                loaderChars,
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "power2.out",
                    stagger: 0.08, // This creates the wave effect
                },
                "-=0.6" // Overlap with logo animation for a smoother feel
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div
            className="loading-animation-container"
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                fontFamily: '"Readex Pro", sans-serif',
            }}
        >
            <div ref={containerRef} style={{ display: 'flex', alignItems: 'center' }}>
                <img
                    src={beanLogo}
                    alt="Bean Journal Logo"
                    className="loader-logo"
                    style={{
                        width: 'clamp(50px, 10vw, 70px)',
                        height: 'clamp(50px, 10vw, 70px)',
                        marginRight: '20px'
                    }}
                />
                <div
                    className="loader-text dark:text-white"
                    style={{
                        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                        fontWeight: 600,
                    }}
                >
                    {text.split('').map((char, index) => (
                        <span
                            key={index}
                            style={{
                                display: 'inline-block',
                                whiteSpace: 'pre',
                            }}
                        >
                            {char}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingAnimation; 