const tokenBlacklist = new Set();

export const addToBlacklist = (token) => {
  if (token) {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    tokenBlacklist.add(cleanToken);
  }
};

export const isTokenBlacklisted = (token) => {
  if (!token) return false;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
  return tokenBlacklist.has(cleanToken);
};
