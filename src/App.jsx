import React from 'react';
import EmotionalLandscape from './components/EmotionalLandscape';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>NYT Emotional Landscape</h1>
        <p>A real-time 3D visualization of news emotions</p>
      </header>
      <main>
        <EmotionalLandscape />
      </main>
      <footer>
        <p>
          Data provided by the <a href="https://developer.nytimes.com/" target="_blank" rel="noopener noreferrer">New York Times API</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
