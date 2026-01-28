import { readFileSync, writeFileSync, existsSync } from 'fs';

/**
 * Read JSON file and return parsed data
 * @param {string} filePath - Path to the JSON file
 * @param {any} defaultValue - Default value if file doesn't exist
 * @returns {any} Parsed JSON data or default value
 */
export const readJSONFile = (filePath, defaultValue = []) => {
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
};

/**
 * Write data to JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {any} data - Data to write
 * @returns {boolean} Success status
 */
export const writeJSONFile = (filePath, data) => {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};
