import axios from 'axios';

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_NYT_API_KEY || 'YOUR_NYT_API_KEY';
const NEWSWIRE_URL = `https://api.nytimes.com/svc/news/v3/content/all/all.json?api-key=${API_KEY}`;

// Sample headlines and abstracts for generating synthetic data
const sampleHeadlines = [
  "Breaking: Major Development in Global Markets",
  "New Study Reveals Surprising Health Benefits",
  "Political Leaders Meet for Historic Summit",
  "Tech Giant Announces Revolutionary Product",
  "Environmental Crisis Worsens in Key Regions",
  "Sports Team Clinches Dramatic Victory",
  "Entertainment Industry Faces Unprecedented Changes",
  "Economic Indicators Show Shifting Trends",
  "Scientists Make Breakthrough Discovery",
  "Cultural Event Draws Record Attendance"
];

const sampleAbstracts = [
  "Experts analyze the implications of this development across multiple sectors.",
  "Researchers highlight significant findings that could change current understanding.",
  "The meeting addressed critical issues affecting international relations.",
  "Analysts predict this innovation will disrupt the industry landscape.",
  "Urgent action is needed as conditions deteriorate rapidly.",
  "A last-minute effort secured an unexpected win against strong opposition.",
  "Industry leaders respond to evolving consumer preferences and technology.",
  "Financial experts weigh in on what these numbers mean for the future.",
  "The discovery opens new possibilities for addressing longstanding challenges.",
  "Critics and audiences alike respond to the groundbreaking presentation."
];

// Generate a synthetic article with random emotion patterns
const generateSyntheticArticle = (baseArticles = []) => {
  // Create a random title and abstract
  const title = sampleHeadlines[Math.floor(Math.random() * sampleHeadlines.length)];
  const abstract = sampleAbstracts[Math.floor(Math.random() * sampleAbstracts.length)];
  
  // Generate a unique ID
  const id = `synthetic-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Copy structure from existing articles if available
  const template = baseArticles.length > 0 ? baseArticles[0] : {};
  
  return {
    ...template,
    title,
    abstract,
    id,
    url: '#synthetic',
    published_date: new Date().toISOString(),
    // Mark as synthetic so we can filter if needed
    synthetic: true
  };
};

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
export const startNewsStream = (callback, interval = 20000) => {
  let realArticles = [];
  let syntheticInterval;
  
  // Fetch real data immediately
  fetchLatestNews().then(articles => {
    realArticles = articles;
    callback(articles);
    
    // Start generating synthetic data every few seconds
    syntheticInterval = setInterval(() => {
      // Generate 1-3 synthetic articles
      const numSynthetic = Math.floor(Math.random() * 3) + 1;
      const syntheticArticles = [];
      
      for (let i = 0; i < numSynthetic; i++) {
        syntheticArticles.push(generateSyntheticArticle(realArticles));
      }
      
      // Combine a few real articles with synthetic ones for a more natural feed
      const combinedArticles = [
        ...syntheticArticles,
        ...realArticles.slice(0, 5)
      ];
      
      // Shuffle the array to mix real and synthetic
      const shuffled = combinedArticles.sort(() => 0.5 - Math.random());
      
      callback(shuffled);
    }, 5000); // Generate new synthetic data every 5 seconds
  });
  
  // Then set up interval for real data
  const realDataTimerId = setInterval(() => {
    fetchLatestNews().then(articles => {
      realArticles = articles; // Update the cached real articles
      callback(articles);
    });
  }, interval);
  
  // Return function to stop all streams
  return () => {
    clearInterval(realDataTimerId);
    clearInterval(syntheticInterval);
  };
}; 