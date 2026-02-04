import { readJSONFile, writeJSONFile } from './dataPersistence.js';
import { paths } from '../config/paths.js';
import { stylists as initialStylists } from '../data/stylists.js';

// Load data from files or initialize with defaults
let stylists = readJSONFile(paths.stylistsFile, initialStylists);
let users = readJSONFile(paths.usersFile, []);
let appointments = readJSONFile(paths.appointmentsFile, []);
let recentlyViewed = readJSONFile(paths.recentlyViewedFile, {});

// Load credentials or initialize
const credentialsData = readJSONFile(paths.credentialsFile, { stylists: {}, users: {} });
const stylistCredentials = new Map(Object.entries(credentialsData.stylists || {}));
const userCredentials = new Map(Object.entries(credentialsData.users || {}));

// Initialize with any existing stylists from initial data if not in JSON file
if (stylists.length === 0 && initialStylists.length > 0) {
  stylists = [...initialStylists];
  saveStylists();
  
  // Set default passwords for initial stylists
  initialStylists.forEach(stylist => {
    const emailLower = stylist.email.toLowerCase();
    if (!stylistCredentials.has(emailLower)) {
      stylistCredentials.set(emailLower, 'default123');
    }
  });
  saveCredentials();
}

// Save functions
export const saveCredentials = () => {
  const credentialsToSave = {
    stylists: Object.fromEntries(stylistCredentials),
    users: Object.fromEntries(userCredentials)
  };
  writeJSONFile(paths.credentialsFile, credentialsToSave);
};

export const saveStylists = () => {
  writeJSONFile(paths.stylistsFile, stylists);
};

export const saveUsers = () => {
  writeJSONFile(paths.usersFile, users);
};

export const saveAppointments = () => {
  writeJSONFile(paths.appointmentsFile, appointments);
};

export const saveRecentlyViewed = () => {
  writeJSONFile(paths.recentlyViewedFile, recentlyViewed);
};

// Export data stores (these are mutable arrays/maps that controllers will use)
export { stylists, users, appointments, recentlyViewed, stylistCredentials, userCredentials };
