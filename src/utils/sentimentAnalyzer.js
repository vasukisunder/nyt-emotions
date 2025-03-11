import Sentiment from 'sentiment';

// Initialize the sentiment analyzer
const sentiment = new Sentiment();

// Define emotion categories
const emotions = {
  joy: ['happy', 'joy', 'celebration', 'delight', 'triumph', 'pleased', 'glad', 'exciting', 'enthusiastic', 'optimistic'],
  anger: ['angry', 'fury', 'outrage', 'rage', 'wrath', 'indignation', 'irritation', 'annoyance', 'frustrated'],
  sadness: ['sad', 'grief', 'sorrow', 'depression', 'regret', 'despair', 'melancholy', 'gloomy', 'heartbreak'],
  fear: ['fear', 'terror', 'horror', 'dread', 'anxiety', 'panic', 'afraid', 'frightened', 'nervous', 'worried'],
  surprise: ['surprise', 'shock', 'amazement', 'astonish', 'unexpected', 'startled', 'sudden', 'remarkable'],
  disgust: ['disgust', 'revulsion', 'repulsion', 'distaste', 'aversion', 'repugnant', 'offensive', 'repellent']
};

// Analyze text for sentiment and emotions
export const analyzeText = (text) => {
  if (!text) return { score: 0, comparative: 0, emotion: 'neutral', intensity: 0 };
  
  // Get basic sentiment score
  const result = sentiment.analyze(text);
  
  // Determine the dominant emotion
  let dominantEmotion = 'neutral';
  let maxCount = 0;
  
  const emotionCounts = {};
  
  // Convert text to lowercase for comparison
  const lowerText = text.toLowerCase();
  
  // Count emotion words
  Object.entries(emotions).forEach(([emotion, keywords]) => {
    emotionCounts[emotion] = 0;
    
    keywords.forEach(keyword => {
      // Count occurrences of emotion keywords
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        emotionCounts[emotion] += matches.length;
      }
    });
    
    // Update dominant emotion if this one has more occurrences
    if (emotionCounts[emotion] > maxCount) {
      maxCount = emotionCounts[emotion];
      dominantEmotion = emotion;
    }
  });
  
  // If no emotion words were found, determine based on sentiment
  if (maxCount === 0) {
    if (result.score > 2) dominantEmotion = 'joy';
    else if (result.score < -2) dominantEmotion = 'sadness';
  }
  
  // Calculate intensity (absolute value of score, normalized)
  const intensity = Math.min(Math.abs(result.score) / 5, 1);
  
  return {
    ...result,
    emotion: dominantEmotion,
    intensity
  };
};

// Map emotions to colors
export const getEmotionColor = (emotion) => {
  const colorMap = {
    joy: 0x42f59b,      // vibrant mint green
    anger: 0xff4d4d,    // bright red
    sadness: 0x5da9ff,  // light blue
    fear: 0xc05cff,     // rich purple
    surprise: 0xffbb33, // bright gold
    disgust: 0x16e6cc,  // turquoise
    neutral: 0xd9d9d9   // light gray
  };
  
  return colorMap[emotion] || colorMap.neutral;
}; 