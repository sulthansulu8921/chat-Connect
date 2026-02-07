import { type ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Layout({ children }: { children: ReactNode }) {
    const [hearts, setHearts] = useState<{ id: number; left: number; delay: number }[]>([]);

    useEffect(() => {
        // Determine the number of hearts based on screen width
        // Use window.innerWidth to decide. Mobile: fewer hearts.
        const count = window.innerWidth < 768 ? 15 : 30;

        // Generate random hearts
        const newHearts = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: Math.random() * 100, // Random horizontal position 0-100%
            delay: Math.random() * 20, // Random delay
        }));
        setHearts(newHearts);
    }, []);

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-rose-100 via-pink-50 to-rose-200 overflow-hidden relative flex items-center justify-center font-sans selection:bg-rose-200">
            {/* Floating Hearts Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {hearts.map((heart) => (
                    <motion.div
                        key={heart.id}
                        initial={{ y: '110vh', opacity: 0 }}
                        animate={{
                            y: '-10vh',
                            opacity: [0, 0.6, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            delay: heart.delay,
                            ease: "linear"
                        }}
                        style={{
                            left: `${heart.left}%`,
                            fontSize: `${Math.random() * 20 + 20}px`
                        }}
                        className="absolute text-rose-300/40"
                    >
                        ♥
                    </motion.div>
                ))}
            </div>

            <div className="relative z-10 w-full max-w-md px-4 py-8">
                {children}
            </div>
        </div>
    );
}
