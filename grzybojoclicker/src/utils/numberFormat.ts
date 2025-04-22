export const formatNumber = (num: number): string => {
  // For whole numbers, return as is
  if (Number.isInteger(num)) {
    return num.toString();
  }
  
  // For decimal numbers, round to 1 decimal place
  const roundedNum = Math.round(num * 10) / 10;
  
  // If after rounding it's a whole number, return without decimal
  if (Number.isInteger(roundedNum)) {
    return roundedNum.toString();
  }
  
  // Otherwise return with 1 decimal place
  return roundedNum.toString();
};

export const formatLargeNumber = (num: number): string => {
  if (num < 1000) {
    return formatNumber(num);
  }
  
  if (num < 1000000) {
    // Format as K (thousands)
    const value = num / 1000;
    return formatNumber(value) + 'K';
  }
  
  if (num < 1000000000) {
    // Format as M (millions)
    const value = num / 1000000;
    return formatNumber(value) + 'M';
  }

  if (num < 1000000000) {
    // Format as M (millions)
    const value = num / 1000000000;
    return formatNumber(value) + 'B';
  }
  
  // Format as t (trillions)
  const value = num / 1000000000000;
  return formatNumber(value) + 't';
}; 