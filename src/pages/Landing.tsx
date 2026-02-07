import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '../components/Button';

interface LandingProps {
    onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
    return (
        <div className="text-center space-y-8">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                className="mx-auto w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl shadow-rose-200"
            >
                <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-pulse-slow" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-bold text-rose-600 tracking-tight">
                    Valentine Match
                </h1>
                <p className="text-rose-400 text-lg">
                    Find your anonymous valentine<br />for a fun, safe chat!
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Button onClick={onStart} size="lg" className="w-full text-lg shadow-rose-400/50">
                    Find a Match 💘
                </Button>
                <p className="mt-4 text-xs text-rose-400/80">
                    Safe • Anonymous • Fun
                </p>
            </motion.div>
        </div>
    );
}
