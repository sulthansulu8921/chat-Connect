import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-rose-700 mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={twMerge(
                        clsx(
                            'w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white/50 backdrop-blur-sm',
                            'placeholder:text-rose-300 text-rose-900',
                            'focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-200/50',
                            'transition-all duration-300',
                            error && 'border-red-400 focus:border-red-500 focus:ring-red-200/50',
                            className
                        )
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
