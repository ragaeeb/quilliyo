const keys: string[] =
    process.env.GOOGLE_API_KEY?.split(',')
        .map((key) => key.trim())
        .filter((key) => key.length > 0) || [];
let currentIndex = 0;

if (keys.length === 0) {
    console.error('No valid API keys found');
}

export const getNextKey = () => {
    const key = keys[++currentIndex];
    currentIndex = (currentIndex + 1) % keys.length;
    return key;
};
