import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky } from '@react-three/drei';
import EmotionalTerrain from './EmotionalTerrain';
import { analyzeText } from '../utils/sentimentAnalyzer';
import { startNewsStream } from '../services/nytService';

const EmotionalLandscape = () => {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Process news data when it arrives
  const processNewsData = (rawArticles) => {
    if (!rawArticles || !rawArticles.length) return;
    
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
        }
      };
    });
    
    setArticles(processedArticles);
  };
  
  // Start fetching news data
  useEffect(() => {
    const stopStream = startNewsStream(processNewsData);
    
    // Cleanup on unmount
    return () => stopStream();
  }, []);
  
  // Handle clicks on the terrain
  const handleTerrainClick = (article) => {
    setSelectedArticle(article);
  };
  
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 3D Canvas */}
      <Canvas shadows>
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
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        
        {/* Sky background */}
        <Sky sunPosition={[100, 10, 100]} />
        
        {/* Emotional terrain */}
        <EmotionalTerrain 
          articles={articles} 
          onTerrainClick={handleTerrainClick} 
        />
      </Canvas>
      
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
            <strong>Dominant Emotion:</strong> {selectedArticle.sentiment.emotion}
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