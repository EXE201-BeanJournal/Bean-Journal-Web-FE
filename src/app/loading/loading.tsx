'use client';
import { useLayoutEffect, useRef } from 'react';
import styles from './loading.module.css';
import { gsap } from 'gsap';

const Loading = () => {
    const text = "Bean Journal";
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                `.${styles.logo_container}`,
                { y: 0 },
                { y: -40, repeat: -1, yoyo: true, duration: 1, ease: 'power1.inOut' }
            );

            gsap.fromTo(
                `.${styles.wavy} span`,
                { y: 0 },
                {
                    y: -25,
                    repeat: -1,
                    yoyo: true,
                    duration: 0.8,
                    ease: 'power1.inOut',
                    stagger: 0.1,
                }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.logo_container}>
                <svg
                    className={styles.logo}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <path
                        d="M89.2,37.2c-5.9-18.3-21.3-31.4-40-32.9C28.5,2.7,9.1,18.8,7.3,39.3c-1.2,13.5,3.9,26.4,13.5,34.9
	c10.1,8.9,23.3,12.7,35.9,10.9c18.3-2.7,32.7-16.1,36.4-33.8c2-9.7,0.7-19.9-3.9-28.7C87.2,40.1,88.1,38.6,89.2,37.2z M50.4,82.4
	C34.3,83.6,19.6,73.5,16,58.3c-2.4-10.2,0.1-20.9,6.7-29.2c7-8.7,17.8-13.4,28.9-12.2c16.3,1.8,29,15.1,29.8,31.2
	c0.5,10.9-4.7,21.3-13.7,27.5C62.8,80.5,56.6,82.9,50.4,82.4z"
                        fill="currentColor"
                    />
                    <path
                        d="M50.1,19.7c-12.8,11.3-17.3,27.2-9.9,41.9c7,14,21.5,21.9,35.1,19.1c2.1-0.4,4-1.2,5.8-2.2c-5-16.8-18-29.6-33.7-33.2
	C54,18.9,50.7,19.7,50.1,19.7z"
                        fill="currentColor"
                    />
                </svg>
            </div>
            <div className={styles.wavy}>
                {text.split('').map((char, index) => {
                    // To leave space as a gap
                    if (char === ' ') {
                        return (
                            <span key={index} style={{ width: '1rem' }}></span>
                        );
                    }
                    return (
                        <span key={index} >
                            {char}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default Loading; 