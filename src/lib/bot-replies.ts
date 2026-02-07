// Simulates a realistic female persona for the bots
// They should sound natural, slightly casual, and engaging.

export const BOT_GREETINGS = [
    "Hey there! 👋",
    "Hi! How's your day going?",
    "Hello :) Nice to match with you.",
    "Hey! What are you up to?",
    "Hi stranger! How's it going?",
    "Hey! Love your vibe (well, what I can imagine of it haha) 😉",
    "Hi hi! 👋",
];

export const BOT_QUESTIONS = [
    "So, what brings you here today?",
    "Do you have any fun plans for the weekend?",
    "What kind of music are you into?",
    "Are you more of a coffee or tea person? ☕",
    "What's your favorite way to unwind after a long day?",
    "Do you like traveling? I'm dreaming of a vacation rn.",
    "What's good? Tell me something interesting about you.",
    "Seen any good movies lately? I need recommendations!",
    "So, be honest, how's your experience on here been so far? 😅",
];

export const BOT_GENERAL_REPLIES = [
    "Haha that's actually really funny.",
    "Oh really? That's cool!",
    "I totally get that.",
    "Wait, seriously?? No way.",
    "That sounds amazing tbh.",
    "Same here!",
    "Aww that's sweet.",
    "Interesting... tell me more!",
    "Haha fair enough.",
    "I feel that.",
    "You seem pretty cool to talk to :)",
];

export const BOT_FLIRTY_REPLIES = [
    "You're making me smile over here 😊",
    "I bet you say that to all the matches 😉",
    "Ooo okay, I see you.",
    "You're cute (I assume) haha",
    "I like where this is going...",
    "Stop, you're making me blush!",
    "So are you always this charming?",
];

export const BOT_GOODBYES = [
    "Hey, I gotta run! Nice chatting with you though :)",
    "Sorry, my friend just called. Have to go!",
    "It was fun talking, but I'm actually gonna head out. Byeee! 👋",
    "Gotta go do some work now. Catch you later!",
    "Imma head out. Nice meeting you!",
    "Sorry gotta bounce. Bye!",
];

export const BOT_REVEAL_RESPONSES = [
    "You want to reveal already? Haha okay, why not!",
    "Ooo brave! Let's do it.",
    "Sure, I'm down if you are!",
    "Okay let's see who's behind the screen 😉",
];

/**
 * Returns a semi-random response based on input context (very simple for now)
 * or just a general rotation to keep it fresh.
 */
export function getBotReply(lastUserMessage: string): string {
    const lowerMsg = lastUserMessage.toLowerCase();

    // Simple keyword matching for context
    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
        return getRandom(BOT_GREETINGS);
    }

    if (lowerMsg.includes('how are you') || lowerMsg.includes('how are u') || lowerMsg.includes('doing')) {
        return "I'm doing pretty good! Just chilling. You?";
    }

    if (lowerMsg.includes('name') || lowerMsg.includes('who are you')) {
        return "I'm just a girl looking for someone cool to talk to haha. What about you?";
    }

    if (lowerMsg.includes('fake') || lowerMsg.includes('bot') || lowerMsg.includes('real')) {
        return "Um, what? That's a weird thing to ask lol. Definitely real last time I checked!";
    }

    if (lowerMsg.includes('reveal') || lowerMsg.includes('instagram')) {
        return getRandom(BOT_REVEAL_RESPONSES);
    }

    // Default: Mix of questions, comments, and flirty lines
    const roll = Math.random();
    if (roll < 0.3) return getRandom(BOT_QUESTIONS);
    if (roll < 0.8) return getRandom(BOT_GENERAL_REPLIES);
    return getRandom(BOT_FLIRTY_REPLIES);
}

function getRandom(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}
