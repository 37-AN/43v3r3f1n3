export const formatXAxis = (tickItem: string): string => {
  try {
    if (tickItem.includes(':') && (tickItem.includes('AM') || tickItem.includes('PM'))) {
      const parts = tickItem.split(':');
      return `${parts[0]}:${parts[1]} ${tickItem.slice(-2)}`;
    }

    const date = new Date(tickItem);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }

    console.error('Invalid timestamp format:', tickItem);
    return tickItem;
  } catch (error) {
    console.error('Error formatting date:', error);
    return tickItem;
  }
};

export const getRegisterColor = (type: string): string => {
  switch (type) {
    case 'coil': return "#34C759";
    case 'discrete': return "#FF9500";
    case 'input': return "#5856D6";
    case 'holding': return "#FF2D55";
    default: return "#34C759";
  }
};