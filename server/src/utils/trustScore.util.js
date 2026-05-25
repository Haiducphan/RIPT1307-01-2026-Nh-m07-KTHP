function calculateRank(score) {
  if (score >= 90) return 'diamond'; 
  if (score >= 80) return 'gold';  
  if (score >= 65) return 'silver'; 
  if (score >= 50) return 'bronze'; 
  return 'pebble';                  
}

module.exports = { calculateRank };