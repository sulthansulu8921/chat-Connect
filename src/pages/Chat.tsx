import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '../store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Send, Instagram, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getBotReply } from '../lib/bot-replies';

type Message = {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_system: boolean;
    created_at: string;
};

export function Chat() {
    const { id, partnerId, clearMatch } = useUserStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [partner, setPartner] = useState<{ name: string; instagram_id: string; is_bot?: boolean } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasRevealed, setHasRevealed] = useState(false);
    const [partnerLeft, setPartnerLeft] = useState(false); // [NEW]

    // Bot limits
    const botDisconnectLimit = useRef(Math.floor(Math.random() * 3) + 3); // 3 to 5 messages

    // Determine if both have revealed
    const partnerRevealed = messages.some(m => m.is_system && m.content === 'REVEAL_REQUEST' && m.sender_id === partnerId);
    const meRevealed = messages.some(m => m.is_system && m.content === 'REVEAL_REQUEST' && m.sender_id === id);
    const isFullyRevealed = partnerRevealed && meRevealed;

    useEffect(() => {
        if (!partnerId) return;

        // Fetch partner details
        const fetchPartner = async () => {
            const { data } = await supabase.from('users').select('name, instagram_id, is_bot').eq('id', partnerId).single();
            if (data) setPartner(data);
        };
        fetchPartner();

        // Fetch message history
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .in('sender_id', [id, partnerId])
                .in('receiver_id', [id, partnerId])
                .order('created_at', { ascending: true });
            if (data) setMessages(data);
        };
        fetchMessages();

        // Subscribe to new messages AND partner status
        const channel = supabase
            .channel(`chat_${id}_${partnerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${id}`,
                    // Note: Supabase realtime filters are limited. simpler to filter client side or listen to all inserts for this match?
                    // For now, let's just listen to all public messages and filter manually or rely on RLS if set up properly.
                    // Since we can't easily filter by logic OR in realtime string, we'll listen to global messages and filter.
                    // OR better: listen to room `match_id` if we had one.
                    // We'll listen to table `messages` and filter by sender_id or receiver_id.
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (newMsg.sender_id === partnerId) {
                        setMessages((prev) => [...prev, newMsg]);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // [NEW] Listen for partner leaving
                    schema: 'public',
                    table: 'users',
                    filter: `id=eq.${partnerId}`,
                },
                (payload) => {
                    const updatedUser = payload.new as any;
                    if (updatedUser.status !== 'matched' || updatedUser.partner_id !== id) {
                        setPartnerLeft(true);
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [id, partnerId]);

    // Bot Response Logic [NEW]
    useEffect(() => {
        if (!partner?.is_bot || !id || !partnerId) {
            console.log("Bot Effect: Skipping", { partnerBot: partner?.is_bot, id, partnerId });
            return;
        }

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || lastMsg.sender_id !== id) {
            console.log("Bot Effect: Waiting for user msg", { lastMsgSender: lastMsg?.sender_id, myId: id });
            return; // Only reply if last message was from ME
        }

        console.log("Bot Effect: Triggered reply");

        const replyTimeout = setTimeout(async () => {
            let replyContent = '';
            let isSystem = false;
            let shouldDisconnect = false;
            const botMsgCount = messages.filter(m => m.sender_id === partnerId && !m.is_system).length;

            console.log("Bot Effect: Processing reply", { botMsgCount, limit: botDisconnectLimit.current });

            if (lastMsg.is_system && lastMsg.content === 'REVEAL_REQUEST') {
                // Auto-accept reveal
                replyContent = 'REVEAL_REQUEST';
                isSystem = true;
            } else {
                // Check limit
                if (botMsgCount >= botDisconnectLimit.current - 1) {
                    // Send goodbye
                    const goodbyes = [
                        "Hey, I gotta run! Nice chatting with you though :)",
                        "Sorry, my friend just called. Have to go!",
                        "It was fun talking, but I'm actually gonna head out. Byeee! 👋",
                        "Gotta go do some work now. Catch you later!",
                        "Imma head out. Nice meeting you!",
                        "Sorry gotta bounce. Bye!"
                    ];
                    replyContent = goodbyes[Math.floor(Math.random() * goodbyes.length)];
                    shouldDisconnect = true;
                } else {
                    // Generate reply
                    replyContent = getBotReply(lastMsg.content);
                }
            }

            // Insert bot reply into DB
            console.log("Bot Effect: Inserting reply", { replyContent });
            const { error: botError } = await supabase.from('messages').insert([
                { sender_id: partnerId, receiver_id: id, content: replyContent, is_system: isSystem }
            ]);

            if (botError) {
                console.error("Bot Effect: Failed to send reply", botError);
            } else {
                console.log("Bot Effect: Reply sent successfully");

                // Disconnect if goodbye sent
                if (shouldDisconnect) {
                    console.log("Bot Effect: Triggering disconnect");
                    setTimeout(() => {
                        setPartnerLeft(true);
                    }, 2000); // Wait 2s after goodbye to leave
                }
            }

            // Note: Subscription will catch this insert because receiver_id=id matches the filter.
        }, Math.random() * 2000 + 1500); // 1.5s - 3.5s delay

        return () => clearTimeout(replyTimeout);
    }, [messages, partner, id, partnerId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, partnerLeft]); // [NEW] Auto-scroll on partner left too

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !id || !partnerId || partnerLeft) return; // [NEW] Prevent sending if partner left

        const content = inputText.trim();
        setInputText('');

        try {
            const { error } = await supabase.from('messages').insert([
                { sender_id: id, receiver_id: partnerId, content, is_system: false }
            ]);

            if (error) {
                console.error('Error sending message:', error);
                // Optionally revert local state or show error
                // For now, we'll rely on local append but log the error so developer knows
                throw error;
            }

            // Manually append my own message immediately for responsiveness
            setMessages(prev => [...prev, {
                id: Math.random().toString(), // temp id
                sender_id: id,
                receiver_id: partnerId,
                content,
                is_system: false,
                created_at: new Date().toISOString()
            }]);
        } catch (err) {
            console.error(err);
            alert('Failed to send message. Please try again.');
        }
    };

    const handleReveal = async () => {
        if (hasRevealed || !id || !partnerId || partnerLeft) return; // [NEW] Prevent reveal if partner left

        try {
            // Optimistic update
            setHasRevealed(true);

            const { error } = await supabase.from('messages').insert([
                { sender_id: id, receiver_id: partnerId, content: 'REVEAL_REQUEST', is_system: true }
            ]);

            if (error) throw error;

            // Append locally
            setMessages(prev => [...prev, {
                id: Math.random().toString(),
                sender_id: id,
                receiver_id: partnerId,
                content: 'REVEAL_REQUEST',
                is_system: true,
                created_at: new Date().toISOString()
            }]);
        } catch (err) {
            console.error('Error sending reveal request:', err);
            setHasRevealed(false); // Revert on error
            alert('Failed to send reveal request.');
        }
    };

    const handleDisconnect = async () => { // [NEW] Async
        if (id) {
            // [NEW] Update status in DB
            await supabase.from('users').update({ status: 'online', partner_id: null }).eq('id', id);
        }
        clearMatch();
    };

    return (
        <div className="flex flex-col h-[85vh] w-full max-w-md mx-auto bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 relative">
            {/* Header */}
            <div className="p-4 bg-white/80 border-b border-rose-100 flex items-center justify-between z-10 font-bold text-rose-600">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-sm">
                        {partner?.name?.[0] || '?'}
                    </div>
                    <span>{partner?.name || 'Partner'}</span>
                </div>
                <button onClick={handleDisconnect} className="text-xs text-rose-400 hover:text-rose-600">
                    Leave
                </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === id;
                    if (msg.is_system) {
                        return (
                            <div key={idx} className="flex justify-center my-4">
                                <span className="bg-rose-100 text-rose-600 text-xs px-3 py-1 rounded-full border border-rose-200 shadow-sm">
                                    {isMe ? 'You requested to reveal ID' : 'Partner requested to reveal ID'}
                                </span>
                            </div>
                        );
                    }
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={idx}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isMe
                                    ? 'bg-rose-500 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 rounded-tl-none border border-rose-50'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    );
                })}

                {isFullyRevealed && partner && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="font-bold p-6 bg-gradient-to-r from-rose-100 to-pink-100 rounded-xl text-center border-2 border-rose-200 mt-4 shadow-inner"
                    >
                        <p className="text-rose-600 mb-2 text-sm italic">It's a Match! 💘</p>
                        <div className="flex items-center justify-center gap-2 text-xl text-rose-800 bg-white/50 p-2 rounded-lg mb-2">
                            <Instagram className="w-5 h-5" />
                            <span>{partner.instagram_id}</span>
                        </div>
                        <div className="text-xs text-rose-500">
                            Go say hi on Instagram!
                        </div>
                    </motion.div>
                )}
                {partnerLeft && (
                    <div className="flex justify-center my-4">
                        <span className="bg-slate-100 text-slate-500 text-xs px-3 py-1 rounded-full border border-slate-200">
                            Partner has disconnected
                        </span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 border-t border-rose-100 z-10">
                {!isFullyRevealed && !partnerLeft && (
                    <div className="mb-2 flex justify-center">
                        <button
                            onClick={handleReveal}
                            disabled={hasRevealed}
                            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${hasRevealed
                                ? 'bg-rose-100 text-rose-400 cursor-default'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 shadow-sm hover:shadow'
                                }`}
                        >
                            {hasRevealed ? 'Waiting for partner...' : <><Lock className="w-3 h-3" /> Reveal Instagram ID</>}
                        </button>
                    </div>
                )}

                <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={partnerLeft ? "Partner disconnected" : "Type a message..."}
                        disabled={partnerLeft}
                        className="flex-1 bg-rose-50/50 border-rose-100 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <Button
                        size="sm"
                        type="submit"
                        disabled={partnerLeft}
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
