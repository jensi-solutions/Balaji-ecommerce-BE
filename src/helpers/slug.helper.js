/**
 * Generate URL-friendly slug from string
 * @param {string} text
 * @returns {string}
 */
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and special characters with -
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};
