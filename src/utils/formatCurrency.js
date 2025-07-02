export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    amount = 0;
  }
  
  // Format the number to have dot as a thousand separator and no decimals.
  const formattedAmount = Math.round(amount).toLocaleString('de-DE');
  
  return `${formattedAmount} TL`;
}; 