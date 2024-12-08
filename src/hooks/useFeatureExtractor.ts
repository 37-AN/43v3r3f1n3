export const useFeatureExtractor = () => {
  const extractFeatures = (data: string) => {
    const numbers = data.split(' ')
      .map(Number)
      .filter(n => !isNaN(n));
    
    if (numbers.length === 0) return [];

    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    const range = Math.max(...numbers) - Math.min(...numbers);

    return { mean, variance, range };
  };

  return extractFeatures;
};