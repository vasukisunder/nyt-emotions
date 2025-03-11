import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky } from '@react-three/drei';
import EmotionalTerrain from './EmotionalTerrain';
import { analyzeText, getEmotionColor } from '../utils/sentimentAnalyzer';
import { startNewsStream } from '../services/nytService';

// Function to get a readable emotion name
const getEmotionName = (emotion) => {
  const names = {
    joy: 'Joy',
    anger: 'Anger',
    sadness: 'Sadness',
    fear: 'Fear',
    surprise: 'Surprise',
    disgust: 'Disgust',
    neutral: 'Neutral'
  };
  return names[emotion] || 'Unknown';
};

const EmotionalLandscape = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [newArticleNotification, setNewArticleNotification] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Timer for auto-dismissing notifications
  const notificationTimer = useRef(null);
  
  // Process news data when it arrives
  const processNewsData = (rawArticles) => {
    if (!rawArticles || !rawArticles.length) return;
    
    // Only process if we have new articles
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    
    // Process each article to extract sentiment
    const processedArticles = rawArticles.map(article => {
      // Combine headline and abstract for sentiment analysis
      const text = `${article.title} ${article.abstract}`;
      
      // Analyze the text for emotional content
      const sentiment = analyzeText(text);
      
      return {
        ...article,
        sentiment,
        // Add a grid position for placement on the terrain
        gridPosition: {
          x: Math.floor(Math.random() * 100),
          z: Math.floor(Math.random() * 100)
        },
        // Add a timestamp
        processedAt: now
      };
    });
    
    // Update articles
    setArticles(processedArticles);
    
    // If it's been at least 30 seconds since the last update, show a notification
    if (timeSinceLastUpdate > 30000) {
      // Get the most emotionally intense article for the notification
      let mostIntenseArticle = processedArticles[0];
      processedArticles.forEach(article => {
        if (article.sentiment.intensity > mostIntenseArticle.sentiment.intensity) {
          mostIntenseArticle = article;
        }
      });
      
      // Show notification
      setNewArticleNotification({
        title: mostIntenseArticle.title,
        emotion: mostIntenseArticle.sentiment.emotion,
        intensity: mostIntenseArticle.sentiment.intensity,
        timestamp: now
      });
      
      // Set a timer to clear the notification
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
      }
      
      notificationTimer.current = setTimeout(() => {
        setNewArticleNotification(null);
      }, 5000);
      
      setLastUpdateTime(now);
    }
  };
  
  // Start fetching news data
  useEffect(() => {
    const stopStream = startNewsStream(processNewsData);
    
    // Clear any notification timer on unmount
    return () => {
      stopStream();
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
      }
    };
  }, [lastUpdateTime]);
  
  // Auto-dismiss welcome message after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle clicks on the terrain
  const handleTerrainClick = (article) => {
    setSelectedArticle(article);
  };
  
  // Create emotion legend items
  const emotionLegend = [
    { name: 'Joy', color: getEmotionColor('joy') },
    { name: 'Anger', color: getEmotionColor('anger') },
    { name: 'Sadness', color: getEmotionColor('sadness') },
    { name: 'Fear', color: getEmotionColor('fear') },
    { name: 'Surprise', color: getEmotionColor('surprise') },
    { name: 'Disgust', color: getEmotionColor('disgust') },
    { name: 'Neutral', color: getEmotionColor('neutral') }
  ];
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 3D Canvas */}
      <Canvas
        style={{ width: '100%', height: '100vh' }}
        shadows
      >
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[0, 35, 70]} fov={50} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2.5}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        <directionalLight 
          position={[-50, 80, -50]} 
          intensity={0.7} 
          color="#b3ccff" 
          castShadow={false} 
        />
        <pointLight
          position={[0, -30, 0]}
          intensity={0.4}
          color="#ff9966"
          distance={150}
        />
        
        {/* Sky background */}
        <Sky sunPosition={[100, 10, 100]} />
        
        {/* Emotional terrain */}
        <EmotionalTerrain 
          articles={articles} 
          onTerrainClick={handleTerrainClick} 
        />
      </Canvas>
      
      {/* Emotion color legend */}
      <div className="legend">
        <h3>Emotion Colors</h3>
        {emotionLegend.map((emotion, index) => (
          <div className="legend-item" key={index}>
            <div 
              className="legend-color" 
              style={{ 
                backgroundColor: `#${emotion.color.toString(16).padStart(6, '0')}`
              }}
            ></div>
            <span>{emotion.name}</span>
          </div>
        ))}
        <div className="legend-note">
          <p>* Peaks represent emotional intensity</p>
          <p>* Hover over peaks to see articles</p>
        </div>
      </div>
      
      {/* Welcome message */}
      {showWelcome && (
        <div className="welcome-message">
          <h2>Welcome to the NYT Emotional Landscape</h2>
          <p>This visualization transforms news articles into an emotional terrain.</p>
          <p>Colors represent different emotions, while peaks show emotional intensity.</p>
          <p><strong>Hover over</strong> the peaks to highlight articles, and <strong>click</strong> to read more.</p>
          <button onClick={() => setShowWelcome(false)}>Got it!</button>
        </div>
      )}
      
      {/* New article notification */}
      {newArticleNotification && (
        <div className="notification"
          style={{
            backgroundColor: `rgba(${(getEmotionColor(newArticleNotification.emotion) >> 16) & 255}, 
                               ${(getEmotionColor(newArticleNotification.emotion) >> 8) & 255}, 
                               ${getEmotionColor(newArticleNotification.emotion) & 255}, 0.2)`
          }}
        >
          <h3>New Article: {getEmotionName(newArticleNotification.emotion)}</h3>
          <p>{newArticleNotification.title}</p>
        </div>
      )}
      
      {/* Article details panel */}
      {selectedArticle && (
        <div 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '5px',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 100
          }}
        >
          <h2>{selectedArticle.title}</h2>
          <p>{selectedArticle.abstract}</p>
          
          <div>
            <strong>Dominant Emotion:</strong> {getEmotionName(selectedArticle.sentiment.emotion)}
          </div>
          <div>
            <strong>Emotional Intensity:</strong> {Math.round(selectedArticle.sentiment.intensity * 100)}%
          </div>
          
          {selectedArticle.url && (
            <a 
              href={selectedArticle.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '15px',
                padding: '8px 15px',
                background: '#3498db',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '3px'
              }}
            >
              Read Full Article
            </a>
          )}
          
          <button
            onClick={() => setSelectedArticle(null)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default EmotionalLandscape; 