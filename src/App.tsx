import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, Modal, List, ListItem, ListItemText, Paper, ToggleButton, ToggleButtonGroup, Link, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import upgrades from './upgrades.json';
import { formatLargeNumber } from './utils/numberFormat';
import './App.css';

interface Upgrade {
  name: string;
  description: string;
  basePrice: number;
  baseGenerationRate: number;
  priceMultiplier: number;
}

interface FallingUpgradeData {
  id: number;
  x: number;
  y: number;
  image: string;
  count: number;
  isMushroom?: boolean;
}

function App() {
  const [mushrooms, setMushrooms] = useState<number>(0);
  const [ownedUpgrades, setOwnedUpgrades] = useState<{ [key: string]: number }>({});
  const [isUpgradesModalOpen, setIsUpgradesModalOpen] = useState(false);
  const [isGrandPrizeModalOpen, setIsGrandPrizeModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [fallingUpgrades, setFallingUpgrades] = useState<FallingUpgradeData[]>([]);
  const [bulkPurchaseAmount, setBulkPurchaseAmount] = useState<number>(1);
  const [grandPrizeRevealed, setGrandPrizeRevealed] = useState(false);
  const [cheatCode, setCheatCode] = useState<string>('');
  const boiRef = useRef<HTMLDivElement>(null);
  const nextUpgradeId = useRef(0);
  const lastClickTime = useRef(0);
  const clickCooldown = 100; // Reduced cooldown for better responsiveness
  const isInitialized = useRef(false);
  const [mushroomsPerSecond, setMushroomsPerSecond] = useState<number>(0);
  
  // Grand Prize cost - set to be higher than the last upgrade
  const grandPrizeCost = 50000000; // 10 million mushrooms (increased from 1 million)

  // Load saved game state - only once on initial load
  useEffect(() => {
    if (isInitialized.current) return;
    
    try {
      const savedMushrooms = localStorage.getItem('mushrooms');
      const savedUpgrades = localStorage.getItem('ownedUpgrades');
      const savedBulkAmount = localStorage.getItem('bulkPurchaseAmount');
      const savedGrandPrizeRevealed = localStorage.getItem('grandPrizeRevealed');
      
      if (savedMushrooms) {
        const parsedMushrooms = Number(savedMushrooms);
        if (!isNaN(parsedMushrooms)) {
          setMushrooms(parsedMushrooms);
        }
      }
      
      if (savedUpgrades) {
        try {
          const parsedUpgrades = JSON.parse(savedUpgrades);
          setOwnedUpgrades(parsedUpgrades);
        } catch (e) {
          console.error('Error parsing saved upgrades:', e);
        }
      }
      
      if (savedBulkAmount) {
        const parsedAmount = Number(savedBulkAmount);
        if (!isNaN(parsedAmount) && [1, 10, 100].includes(parsedAmount)) {
          setBulkPurchaseAmount(parsedAmount);
        }
      }
      
      if (savedGrandPrizeRevealed) {
        setGrandPrizeRevealed(savedGrandPrizeRevealed === 'true');
      }
      
      isInitialized.current = true;
    } catch (e) {
      console.error('Error loading saved game state:', e);
    }
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (!isInitialized.current) return;
    
    try {
      localStorage.setItem('mushrooms', mushrooms.toString());
      localStorage.setItem('ownedUpgrades', JSON.stringify(ownedUpgrades));
      localStorage.setItem('bulkPurchaseAmount', bulkPurchaseAmount.toString());
      localStorage.setItem('grandPrizeRevealed', grandPrizeRevealed.toString());
    } catch (e) {
      console.error('Error saving game state:', e);
    }
  }, [mushrooms, ownedUpgrades, bulkPurchaseAmount, grandPrizeRevealed]);

  // Calculate mushrooms per second
  useEffect(() => {
    let totalGeneration = 0;
    upgrades.upgrades.forEach((upgrade: Upgrade) => {
      const count = ownedUpgrades[upgrade.name] || 0;
      totalGeneration += count * upgrade.baseGenerationRate;
    });
    setMushroomsPerSecond(totalGeneration);
  }, [ownedUpgrades]);

  // Auto-generation of mushrooms
  useEffect(() => {
    const interval = setInterval(() => {
      let totalGeneration = 0;
      upgrades.upgrades.forEach((upgrade: Upgrade) => {
        const count = ownedUpgrades[upgrade.name] || 0;
        totalGeneration += count * upgrade.baseGenerationRate;
      });
      setMushrooms(prev => prev + totalGeneration);
    }, 1000);

    return () => clearInterval(interval);
  }, [ownedUpgrades]);

  // Create falling upgrade images
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(ownedUpgrades).length === 0) return;
      
      const newFallingUpgrades: FallingUpgradeData[] = [];
      
      upgrades.upgrades.forEach((upgrade: Upgrade) => {
        const count = ownedUpgrades[upgrade.name] || 0;
        if (count > 0) {
          // Create a random number of falling images based on count
          const numImages = Math.min(Math.floor(Math.random() * 3) + 1, count);
          
          for (let i = 0; i < numImages; i++) {
            newFallingUpgrades.push({
              id: nextUpgradeId.current++,
              x: Math.random() * window.innerWidth,
              y: -50 - Math.random() * 100, // Start above the viewport
              image: getUpgradeImage(upgrade.name),
              count: count
            });
          }
        }
      });
      
      if (newFallingUpgrades.length > 0) {
        setFallingUpgrades(prev => [...prev, ...newFallingUpgrades]);
      }
    }, 3000); // Create new falling upgrades every 3 seconds
    
    return () => clearInterval(interval);
  }, [ownedUpgrades]);

  const handleClick = (event: React.MouseEvent) => {
    // Prevent multiple triggers and random firing
    const now = Date.now();
    if (now - lastClickTime.current < clickCooldown) {
      return;
    }
    lastClickTime.current = now;
    
    // Prevent default behavior to avoid zooming on mobile
    event.preventDefault();
    
    // Update mushroom count immediately
    setMushrooms(prev => prev + 1);
    
    // Randomly create a falling mushroom (30% chance)
    if (Math.random() < 0.3) {
      const newFallingUpgrade: FallingUpgradeData = {
        id: nextUpgradeId.current++,
        x: Math.random() * window.innerWidth,
        y: -100 - Math.random() * 200, // Start higher above the viewport
        image: '/mushroom.png',
        count: 1,
        isMushroom: true
      };
      
      setFallingUpgrades(prev => [...prev, newFallingUpgrade]);
    }
  };

  const removeFallingUpgrade = (id: number) => {
    setFallingUpgrades(prev => prev.filter(upgrade => upgrade.id !== id));
  };

  const calculateUpgradePrice = (upgrade: Upgrade, amount: number = 1) => {
    const count = ownedUpgrades[upgrade.name] || 0;
    let totalPrice = 0;
    
    for (let i = 0; i < amount; i++) {
      totalPrice += Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, count + i));
    }
    
    return totalPrice;
  };

  const handleBuyUpgrade = (upgrade: Upgrade) => {
    const price = calculateUpgradePrice(upgrade, bulkPurchaseAmount);
    if (mushrooms >= price) {
      setMushrooms(prev => prev - price);
      setOwnedUpgrades(prev => ({
        ...prev,
        [upgrade.name]: (prev[upgrade.name] || 0) + bulkPurchaseAmount
      }));
    }
  };

  const handleBulkPurchaseChange = (event: React.MouseEvent<HTMLElement>, newAmount: number | null) => {
    if (newAmount !== null) {
      setBulkPurchaseAmount(newAmount);
    }
  };

  const handleBuyGrandPrize = () => {
    if (mushrooms >= grandPrizeCost) {
      setMushrooms(prev => prev - grandPrizeCost);
      setGrandPrizeRevealed(true);
      setIsGrandPrizeModalOpen(true);
    }
  };

  const getUpgradeImage = (upgradeName: string): string => {
    switch (upgradeName) {
      case 'kamienie':
        return '/kamienie.png';
      case 'twój stary':
        return '/twoj_stary.png';
      case 'bełkot':
        return '/belkot.jpg';
      case 'Pedałowanie':
        return '/pedalowanie.png';
      case 'Landlord':
        return '/landlord.png';
      case 'meshtastic':
        return '/meshtastic.png';
      case 'giełda':
        return '/gielda.png';
      case 'pikseluwy':
        return '/pixeluwy.jpg';
      case 'haskell':
        return '/haskell.png';
      case 'AoC':
        return '/aoc.png';
      case 'Happy Place':
        return '/happy_place.png';
      default:
        return '/placeholder.png';
    }
  };

  const handleResetGame = () => {
    // Clear local storage
    localStorage.removeItem('mushrooms');
    localStorage.removeItem('ownedUpgrades');
    localStorage.removeItem('bulkPurchaseAmount');
    localStorage.removeItem('grandPrizeRevealed');
    
    // Reset game state
    setMushrooms(0);
    setOwnedUpgrades({});
    setBulkPurchaseAmount(1);
    setGrandPrizeRevealed(false);
    setFallingUpgrades([]);
    
    // Close modals
    setIsResetConfirmOpen(false);
    setIsUpgradesModalOpen(false);
    
    // Reset initialization flag to allow reloading from storage
    isInitialized.current = false;
  };

  const handleCheatCodeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (cheatCode.toLowerCase() === 'klapaucius') {
      // Add 1000 mushrooms
      setMushrooms(prev => prev + 1000);
      // Clear the input
      setCheatCode('');
    } else if (cheatCode.toLowerCase() === 'motherlode') {
      // Add 50000 mushrooms
      setMushrooms(prev => prev + 50000);
      // Clear the input
      setCheatCode('');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      backgroundImage: 'url(/background.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      pb: 10 // Add padding at the bottom for the upgrades button
    }}>
      {/* Mushroom counter with darker background */}
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        borderRadius: 2, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="h4" sx={{ color: 'white' }}>
          Grzybi: {formatLargeNumber(mushrooms)}
        </Typography>
        <Typography variant="h6" sx={{ color: 'white', mt: 1 }}>
          {formatLargeNumber(mushroomsPerSecond)} gps
        </Typography>
      </Box>

      {/* Clickable boi image */}
      <Box
        ref={boiRef}
        component="img"
        src="/boi.png"
        alt="Clickable boi"
        onClick={handleClick}
        onTouchStart={(e) => e.preventDefault()}
        sx={{
          width: '300px',
          height: '300px',
          cursor: 'pointer',
          my: 4,
          transition: 'transform 0.1s',
          '&:active': {
            transform: 'scale(0.95)'
          },
          position: 'relative',
          zIndex: 5,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          outline: 'none',
          '-webkit-tap-highlight-color': 'transparent',
          '-webkit-touch-callout': 'none',
          '-webkit-user-select': 'none',
          '-moz-user-select': 'none',
          '-ms-user-select': 'none',
          'pointer-events': 'auto'
        }}
      />

      {/* Falling upgrade images */}
      {fallingUpgrades.map(upgrade => (
        <Box
          key={upgrade.id}
          sx={{
            position: 'fixed',
            left: upgrade.x,
            top: upgrade.y,
            width: upgrade.isMushroom ? '240px' : '60px', // 4 times bigger for mushroom
            height: upgrade.isMushroom ? '240px' : '60px', // 4 times bigger for mushroom
            opacity: upgrade.isMushroom ? 0.6 : 0.5, // Increased opacity for all images
            zIndex: 1,
            animation: 'fall 10s linear forwards',
            '@keyframes fall': {
              '0%': {
                transform: 'translateY(0) rotate(0deg)',
                opacity: upgrade.isMushroom ? 0.6 : 0.5 // Increased opacity for all images
              },
              '100%': {
                transform: 'translateY(100vh) rotate(360deg)',
                opacity: 0
              }
            }
          }}
          onAnimationEnd={() => removeFallingUpgrade(upgrade.id)}
        >
          <img 
            src={upgrade.image} 
            alt="Upgrade" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </Box>
      ))}

      {/* Button container - fixed to bottom */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 20, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 2,
        zIndex: 10,
        px: 2
      }}>
        {/* Grand Prize button */}
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleBuyGrandPrize}
          disabled={mushrooms < grandPrizeCost || grandPrizeRevealed}
          fullWidth
          sx={{ 
            py: 1.5,
            fontSize: '1.2rem',
            maxWidth: '400px'
          }}
        >
          GRAND PRIZE ({formatLargeNumber(grandPrizeCost)})
        </Button>

        {/* Upgrades button */}
        <Button 
          variant="contained" 
          onClick={() => setIsUpgradesModalOpen(true)}
          fullWidth
          sx={{ 
            py: 1.5,
            fontSize: '1.2rem',
            maxWidth: '400px'
          }}
        >
          Upgrades
        </Button>
      </Box>

      {/* Upgrades Modal */}
      <Modal
        open={isUpgradesModalOpen}
        onClose={() => setIsUpgradesModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{
          width: '90%',
          maxWidth: 600,
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Sticky header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 1
          }}>
            <Typography variant="h6">Upgrades</Typography>
            <IconButton 
              edge="end" 
              color="inherit" 
              onClick={() => setIsUpgradesModalOpen(false)} 
              aria-label="close"
            >
              <Typography variant="h6">X</Typography>
            </IconButton>
          </Box>
          
          {/* Bulk purchase buttons with reset button and cheat code input */}
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'background.paper',
            position: 'sticky',
            top: 56, // Height of the header
            zIndex: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            <ToggleButtonGroup
              value={bulkPurchaseAmount}
              exclusive
              onChange={handleBulkPurchaseChange}
              aria-label="bulk purchase amount"
              sx={{
                '& .MuiToggleButton-root': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  }
                }
              }}
            >
              <ToggleButton value={1} aria-label="buy 1">
                Buy 1
              </ToggleButton>
              <ToggleButton value={10} aria-label="buy 10">
                Buy 10
              </ToggleButton>
            </ToggleButtonGroup>
            
            {/* Hidden cheat code input */}
            <form onSubmit={handleCheatCodeSubmit} style={{ margin: '0 10px' }}>
              <TextField
                value={cheatCode}
                onChange={(e) => setCheatCode(e.target.value)}
                variant="outlined"
                size="small"
                placeholder=""
                sx={{ 
                  width: '100px',
                  '& .MuiOutlinedInput-root': {
                    height: '36px',
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: 'transparent',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'transparent',
                    }
                  }
                }}
              />
            </form>
            
            {/* Reset button - now rectangular */}
            <Button 
              variant="outlined" 
              color="error" 
              onClick={() => setIsResetConfirmOpen(true)}
              aria-label="reset game"
              sx={{ 
                minWidth: '40px',
                height: '36px',
                p: 0,
                borderColor: 'error.main',
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderColor: 'error.dark'
                }
              }}
            >
              <Typography variant="h6" sx={{ color: 'error.main' }}>!</Typography>
            </Button>
          </Box>
          
          {/* Upgrades list */}
          <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
            <List>
              {upgrades.upgrades.map((upgrade: Upgrade) => {
                const count = ownedUpgrades[upgrade.name] || 0;
                const price = calculateUpgradePrice(upgrade, bulkPurchaseAmount);
                return (
                  <ListItem key={upgrade.name} divider>
                    <Box 
                      component="img"
                      src={getUpgradeImage(upgrade.name)} 
                      alt={upgrade.name}
                      sx={{ 
                        width: 56, 
                        height: 56, 
                        mr: 2,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                    <ListItemText
                      primary={upgrade.name.toUpperCase()}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {upgrade.description} (Generuje {formatLargeNumber(upgrade.baseGenerationRate)} grzybi/s)
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            Owned: {count} | Price: {formatLargeNumber(price)} mushrooms
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2">
                            Generation: {formatLargeNumber(count * upgrade.baseGenerationRate)}/s
                          </Typography>
                        </>
                      }
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleBuyUpgrade(upgrade)}
                      disabled={mushrooms < price}
                    >
                      Buy {bulkPurchaseAmount > 1 ? `(${bulkPurchaseAmount})` : ''}
                    </Button>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Paper>
      </Modal>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        aria-labelledby="reset-dialog-title"
      >
        <DialogTitle id="reset-dialog-title" sx={{ color: 'error.main' }}>
          Reset Game Progress
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset your game progress? This will clear all your mushrooms and upgrades. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsResetConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleResetGame} color="error" variant="contained">
            Reset Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grand Prize Modal */}
      <Modal
        open={isGrandPrizeModalOpen}
        onClose={() => setIsGrandPrizeModalOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{
          width: '90%',
          maxWidth: 600,
          p: 4,
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white'
        }}>
          <Typography variant="h4" sx={{ mb: 4, fontStyle: 'italic' }}>
            "Samuraj nie ma celu, tylko drogę" ~Sumimasen
          </Typography>
          <Link 
            href="https://www.youtube.com/watch?v=pzagBTcYsYQ" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              color: 'primary.main',
              fontSize: '1.2rem',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Click here to discover the truth
          </Link>
        </Paper>
      </Modal>
    </Box>
  );
}

export default App;
