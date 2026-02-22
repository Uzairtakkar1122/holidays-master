import React, { useState, useEffect, useRef } from 'react';

const useScrollReveal = (threshold = 0.1) => {
    const [isVisible, setIsVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => setIsVisible(entry.isIntersecting));
        }, { threshold });

        const currentRef = domRef.current;
        if (currentRef) observer.observe(currentRef);

        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, [threshold]);

    return [domRef, isVisible];
};

const FadeInSection = ({ children, delay = '0ms', direction = 'up' }) => {
    const [ref, isVisible] = useScrollReveal();

    const translateClass = direction === 'up' ? 'translate-y-10' :
        direction === 'left' ? '-translate-x-10' : 'translate-x-10';

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${translateClass}`
                }`}
            style={{ transitionDelay: delay }}
        >
            {children}
        </div>
    );
};

export default FadeInSection;
