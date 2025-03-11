import Sentiment from 'sentiment';

// Initialize the sentiment analyzer
const sentiment = new Sentiment();

// Define emotion categories
const emotions = {
  joy: ['happy', 'joy', 'celebration', 'delight', 'triumph', 'pleased', 'glad'],
  anger: ['angry', 'fury', 'outrage', 'rage', 'wrath', 'indignation'],
  sadness: ['sad', 'grief', 'sorrow', 'depression', 'regret', 'despair'],
  fear: ['fear', 'terror', 'horror', 'dread', 'anxiety', 'panic'],
  surprise: ['surprise', 'shock', 'amazement', 'astonish', 'unexpected'],
  disgust: ['disgust', 'revulsion', 'repulsion', 'distaste', 'aversion']
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
    joy: 0x2ecc71,      // green
    anger: 0xe74c3c,    // red
    sadness: 0x3498db,  // blue
    fear: 0x9b59b6,     // purple
    surprise: 0xf39c12, // orange
    disgust: 0x1abc9c,  // teal
    neutral: 0xbdc3c7   // gray
  };
  
  return colorMap[emotion] || colorMap.neutral;
}; 