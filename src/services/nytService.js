import axios from 'axios';

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_NYT_API_KEY || 'YOUR_NYT_API_KEY';
const NEWSWIRE_URL = `https://api.nytimes.com/svc/news/v3/content/all/all.json?api-key=${API_KEY}`;

// Fetch the latest news articles
export const fetchLatestNews = async () => {
  try {
    const response = await axios.get(NEWSWIRE_URL);
    return response.data.results;
  } catch (error) {
    console.error('Error fetching news data:', error);
    return [];
  }
};

// Function to fetch news at regular intervals
export const startNewsStream = (callback, interval = 60000) => {
  // Fetch immediately
  fetchLatestNews().then(articles => callback(articles));
  
  // Then set up interval
  const timerId = setInterval(() => {
    fetchLatestNews().then(articles => callback(articles));
  }, interval);
  
  // Return function to stop the stream
  return () => clearInterval(timerId);
}; 