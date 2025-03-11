import React, { useRef, useMemo, useEffect, useState } from 'react';
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
  const [hoveredArticleIndex, setHoveredArticleIndex] = useState(null);
  
  // Map articles to grid positions for lookup
  const articlePositionMap = useMemo(() => {
    const map = new Map();
    const articlePoints = [];
    
    articles.forEach((article, index) => {
      // Place important articles in more visible spots
      // This is a simple algorithm - could be enhanced with more sophisticated placement
      const x = Math.floor(Math.random() * GRID_WIDTH);
      const z = Math.floor(Math.random() * GRID_DEPTH);
      const key = `${x},${z}`;
      map.set(key, { article, index });
      
      // Store points for raycasting
      articlePoints.push({
        position: new THREE.Vector3(x - GRID_WIDTH / 2, 0, z - GRID_DEPTH / 2),
        articleIndex: index
      });
    });
    
    return { map, points: articlePoints };
  }, [articles]);
  
  // Generate the terrain geometry
  const { positions, normals, colors, indices } = useMemo(() => {
    // Create empty arrays for geometry data
    const positions = [];
    const normals = [];
    const colors = [];
    const indices = [];
    
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
        const articleData = articlePositionMap.map.get(articleKey);
        
        let color = new THREE.Color(0x888888); // Default gray color
        
        if (articleData) {
          const { article, index } = articleData;
          // Amplify height based on emotional intensity
          const intensity = article.sentiment?.intensity || 0.5;
          height += intensity * MAX_HEIGHT;
          
          // Set color based on dominant emotion
          const emotion = article.sentiment?.emotion || 'neutral';
          
          // If this article is currently hovered, highlight it
          if (index === hoveredArticleIndex) {
            color = new THREE.Color(0xffffff); // Bright white for highlight
          } else {
            color = new THREE.Color(getEmotionColor(emotion));
          }
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
  }, [articles, noiseGenerator, articlePositionMap, hoveredArticleIndex]);
  
  // Handle terrain interactions like click events
  const handleClick = (event) => {
    if (!onTerrainClick) return;
    
    // Prevent event from propagating to other elements
    event.stopPropagation();
    
    // Get the exact point where the ray intersects the terrain
    const { point } = event;
    
    // Find the closest article to the clicked point
    let closestArticle = null;
    let closestDistance = Infinity;
    
    // Convert point to grid coordinates
    const gridX = Math.floor(point.x + GRID_WIDTH / 2);
    const gridZ = Math.floor(point.z + GRID_DEPTH / 2);
    
    // Check in a 3x3 grid around the click point for articles
    for (let z = gridZ - 1; z <= gridZ + 1; z++) {
      for (let x = gridX - 1; x <= gridX + 1; x++) {
        if (x >= 0 && x < GRID_WIDTH && z >= 0 && z < GRID_DEPTH) {
          const key = `${x},${z}`;
          const articleData = articlePositionMap.map.get(key);
          
          if (articleData) {
            const distance = Math.sqrt(
              Math.pow(x - gridX, 2) + 
              Math.pow(z - gridZ, 2)
            );
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestArticle = articleData.article;
            }
          }
        }
      }
    }
    
    if (closestArticle && closestDistance < 2) {
      onTerrainClick(closestArticle);
    }
  };
  
  // Handle pointer movement for hover effects
  const handlePointerMove = (event) => {
    // Prevent event from propagating
    event.stopPropagation();
    
    // Get the exact point where the ray intersects the terrain
    const { point } = event;
    
    // Convert point to grid coordinates
    const gridX = Math.floor(point.x + GRID_WIDTH / 2);
    const gridZ = Math.floor(point.z + GRID_DEPTH / 2);
    
    // Check if there's an article at this position
    const key = `${gridX},${gridZ}`;
    const articleData = articlePositionMap.map.get(key);
    
    if (articleData) {
      setHoveredArticleIndex(articleData.index);
      document.body.style.cursor = 'pointer';
    } else {
      setHoveredArticleIndex(null);
      document.body.style.cursor = 'default';
    }
  };
  
  // Reset cursor when pointer leaves the terrain
  const handlePointerOut = () => {
    setHoveredArticleIndex(null);
    document.body.style.cursor = 'default';
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
    
    // Very subtle rotation to make the landscape feel alive
    meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.03;
  });
  
  return (
    <mesh 
      ref={meshRef} 
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      rotation={[0, 0, 0]}
    >
      <bufferGeometry />
      <meshStandardMaterial 
        vertexColors 
        side={THREE.DoubleSide}
        roughness={0.5}
        metalness={0.4}
        wireframe={false}
        flatShading={false}
      />
    </mesh>
  );
};

export default EmotionalTerrain; 