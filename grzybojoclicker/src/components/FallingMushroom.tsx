import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

interface FallingMushroomProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const FallingMushroom: React.FC<FallingMushroomProps> = ({ x, y, onComplete }) => {
  const [position, setPosition] = useState({ x, y });
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    const startTime = Date.now();
    const duration = 1000; // 1 second animation
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Move down and fade out
      setPosition({
        x: x + Math.sin(progress * Math.PI) * 50, // Slight horizontal movement
        y: y + progress * 100 // Move down
      });
      
      setOpacity(1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    
    requestAnimationFrame(animate);
  }, [x, y, onComplete]);
  
  return (
    <Box
      component="img"
      src="/mushroom.png"
      alt="Mushroom"
      sx={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '30px',
        height: '30px',
        opacity,
        pointerEvents: 'none',
        zIndex: 10,
        transition: 'opacity 0.1s'
      }}
    />
  );
};

export default FallingMushroom; 