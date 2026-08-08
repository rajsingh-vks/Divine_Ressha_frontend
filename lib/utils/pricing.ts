export const DISCOUNT_PERCENT = 20;

export const getDiscountedPrice = (price: number) => {
  const normalizedPrice = Number(price);
  if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) return 0;

  return Math.round(normalizedPrice * (1 - DISCOUNT_PERCENT / 100));
};

export const getDiscountAmount = (price: number) => {
  const normalizedPrice = Number(price);
  return Math.max(0, normalizedPrice - getDiscountedPrice(normalizedPrice));
};
