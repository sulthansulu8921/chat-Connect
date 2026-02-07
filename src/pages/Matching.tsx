import { useEffect, useState } from 'react';
import { useUserStore } from '../store';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function Matching() {
    const { id, setMatch } = useUserStore();
    const [dots, setDots] = useState('');

    // Animation for dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Matching Logic
    useEffect(() => {
        if (!id) return;

        let isMatched = false;

        // Subscription for realtime updates (if someone matches WITH us)
        const channel = supabase
            .channel(`user_${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    const newUser = payload.new as any;
                    if (newUser.status === 'matched' && newUser.partner_id) {
                        isMatched = true;
                        setMatch(newUser.partner_id);
                    }
                }
            )
            .subscribe();

        // Polling interval to strictly find a match actively
        const interval = setInterval(async () => {
            if (isMatched) return;

            const { data } = await supabase.rpc('find_match', { user_id: id });

            if (data && data.length > 0 && data[0].success) {
                // We found a match!
                isMatched = true;
                setMatch(data[0].matched_user_id);
            }
        }, 3000);

        return () => {
            channel.unsubscribe();
            clearInterval(interval);
        };
    }, [id, setMatch]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
            {/* Spinner Section */}
            <div className="relative">
                {/* Glow Effect */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 -m-4 bg-rose-500 rounded-full blur-3xl opacity-30"
                />

                {/* Main White Circle */}
                <div className="relative bg-white w-32 h-32 rounded-full flex items-center justify-center shadow-xl shadow-rose-100 ring-4 ring-white">
                    {/* Custom Spinner Ring */}
                    <div className="absolute inset-0 p-1">
                        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                            {/* Track */}
                            <circle
                                cx="50"
                                cy="50"
                                r="44"
                                fill="none"
                                stroke="#ffe4e6" // rose-100
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            {/* Moving Dash */}
                            <circle
                                cx="50"
                                cy="50"
                                r="44"
                                fill="none"
                                stroke="#f43f5e" // rose-500
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray="60 220"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                    </div>

                    {/* Inner content (optional, maybe a small pulsing dot or icon?) */}
                    {/* Based on mock, it seems empty or has a subtle indicator. I'll add a subtle pulsing core. */}
                    <motion.div
                        animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 bg-rose-400 rounded-full"
                    />
                </div>
            </div>

            {/* Text Content */}
            <div className="space-y-3 z-10">
                <h2 className="text-2xl font-bold text-rose-600 tracking-tight">
                    Looking for your Valentine{dots}
                </h2>
                <p className="text-rose-400 max-w-xs mx-auto text-lg leading-relaxed">
                    We are searching for a compatible<br />match nearby. Hang tight!
                </p>
            </div>

            {/* Tip Box */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full text-sm text-rose-500 font-medium border border-rose-100 shadow-sm"
            >
                Tip: Be polite and have fun! 🌹
            </motion.div>
        </div>
    );
}
