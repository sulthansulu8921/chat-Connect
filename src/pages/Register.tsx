import { useState } from 'react';
import { useUserStore } from '../store';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export function Register() {
    const setUser = useUserStore((state) => state.setUser);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        instagramId: '',
        gender: 'male',
        targetGender: 'female',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.age || !formData.instagramId) {
            setError('Please fill in all fields');
            return;
        }

        // Validate Age
        const age = parseInt(formData.age);
        if (age < 18) {
            setError('You must be 18+ to use this app');
            return;
        }
        if (age > 100) {
            setError('Please enter a valid age');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create user in Supabase
            const { data, error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        name: formData.name,
                        age: age,
                        gender: formData.gender,
                        target_gender: formData.targetGender,
                        instagram_id: formData.instagramId,
                        status: 'matching', // Go straight to matching
                    },
                ])
                .select()
                .single();

            if (dbError) throw dbError;

            if (data) {
                setUser({
                    id: data.id,
                    name: data.name,
                    age: data.age,
                    gender: data.gender,
                    targetGender: data.target_gender,
                    instagramId: data.instagram_id,
                    status: 'matching',
                });
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to register');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h2 className="text-2xl font-bold text-rose-600">Create Profile</h2>
                <p className="text-rose-400">Let's find your valentine!</p>
            </motion.div>

            <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className="space-y-4 glass-card p-6 rounded-2xl"
            >
                <Input
                    label="Your Name"
                    placeholder="Cupid"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <Input
                    label="Age"
                    type="number"
                    placeholder="21"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />

                <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">Gender</label>
                    <div className="flex gap-2">
                        {(['male', 'female', 'non-binary'] as const).map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: g })}
                                className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${formData.gender === g
                                        ? 'bg-rose-500 text-white border-rose-500'
                                        : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                                    }`}
                            >
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1">Interested In</label>
                    <div className="flex gap-2 flex-wrap">
                        {(['male', 'female', 'everyone'] as const).map((g) => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({ ...formData, targetGender: g })}
                                className={`flex-1 py-2 px-1 rounded-lg text-sm border transition-colors ${formData.targetGender === g
                                        ? 'bg-rose-500 text-white border-rose-500'
                                        : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'
                                    }`}
                            >
                                {g.charAt(0).toUpperCase() + g.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <Input
                    label="Instagram ID"
                    placeholder="@username"
                    value={formData.instagramId}
                    onChange={(e) => setFormData({ ...formData, instagramId: e.target.value })}
                />

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4"
                >
                    {loading ? 'Setting up...' : 'Start Matching'}
                </Button>
            </motion.form>
        </div>
    );
}
