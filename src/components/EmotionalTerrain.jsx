import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import { getEmotionColor } from '../utils/sentimentAnalyzer';

// Constants for terrain generation
const GRID_WIDTH = 100;
const GRID_DEPTH = 100;
const MAX_HEIGHT = 10;

const EmotionalTerrain = ({ articles = [], onTerrainClick }) => {
  const meshRef = useRef();
  const noiseGenerator = useMemo(() => new SimplexNoise(), []);
  
  // Generate the terrain geometry
  const { positions, normals, colors, indices } = useMemo(() => {
    // Create empty arrays for geometry data
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
    // Create a map to store article positions
    const articleMap = new Map();
    
    // Map articles to grid positions
    articles.forEach((article, index) => {
      // Place important articles in more visible spots
      // This is a simple algorithm - could be enhanced with more sophisticated placement
      const x = Math.floor(Math.random() * GRID_WIDTH);
      const z = Math.floor(Math.random() * GRID_DEPTH);
      articleMap.set(`${x},${z}`, article);
    });
    
    // Generate the grid vertices
    for (let z = 0; z < GRID_DEPTH; z++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        // Normalize coordinates to [0,1] for noise function
        const nx = x / GRID_WIDTH - 0.5;
        const nz = z / GRID_DEPTH - 0.5;
        
        // Base height is using simplex noise for natural terrain
        let height = noiseGenerator.noise(nx * 2, nz * 2) * 2;
        
        // If there's an article at this position, adjust height based on emotion intensity
        const articleKey = `${x},${z}`;
        const article = articleMap.get(articleKey);
        
        let color = new THREE.Color(0x888888); // Default gray color
        
        if (article) {
          // Amplify height based on emotional intensity
          const intensity = article.sentiment?.intensity || 0.5;
          height += intensity * MAX_HEIGHT;
          
          // Set color based on dominant emotion
          const emotion = article.sentiment?.emotion || 'neutral';
          color = new THREE.Color(getEmotionColor(emotion));
        }
        
        // Add a vertex at this grid position
        positions.push(x - GRID_WIDTH / 2, height, z - GRID_DEPTH / 2);
        
        // We'll calculate normals later
        normals.push(0, 1, 0);
        
        // Add the vertex color
        colors.push(color.r, color.g, color.b);
      }
    }
    
    // Generate the indices for triangle faces
    for (let z = 0; z < GRID_DEPTH - 1; z++) {
      for (let x = 0; x < GRID_WIDTH - 1; x++) {
        const a = x + z * GRID_WIDTH;
        const b = x + (z + 1) * GRID_WIDTH;
        const c = (x + 1) + (z + 1) * GRID_WIDTH;
        const d = (x + 1) + z * GRID_WIDTH;
        
        // Two triangles per grid cell
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      colors: new Float32Array(colors),
      indices: new Uint32Array(indices),
    };
  }, [articles, noiseGenerator]);
  
  // Handle terrain interactions like click events
  const handleClick = (event) => {
    if (!onTerrainClick) return;
    
    // Calculate grid position from click coordinates
    const { point } = event;
    const x = Math.floor(point.x + GRID_WIDTH / 2);
    const z = Math.floor(point.z + GRID_DEPTH / 2);
    
    // Find if there's an article at this position
    const article = articles.find(article => {
      const pos = article.gridPosition;
      return pos && pos.x === x && pos.z === z;
    });
    
    if (article) {
      onTerrainClick(article);
    }
  };
  
  // Update mesh when data changes
  useEffect(() => {
    if (!meshRef.current) return;
    
    const geometry = meshRef.current.geometry;
    
    // Update the geometry with new data
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    // Recompute vertex normals for proper lighting
    geometry.computeVertexNormals();
    
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }, [positions, normals, colors, indices]);
  
  // Add subtle animation to the terrain
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Very subtle movement to make the landscape feel alive
    meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.03;
  });
  
  return (
    <mesh 
      ref={meshRef} 
      onClick={handleClick}
      rotation={[0, 0, 0]}
    >
      <bufferGeometry />
      <meshStandardMaterial 
        vertexColors 
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

export default EmotionalTerrain; 