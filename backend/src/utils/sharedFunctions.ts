export const formatToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

// Helper function to convert paise to rupees
export const paiseToRupees = (paise: number): number => {
  return paise / 100;
};

// Helper function to convert rupees to paise
export const rupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};
