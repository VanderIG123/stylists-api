import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
const uploadsDir = join(__dirname, '..', 'uploads');
const profilesDir = join(uploadsDir, 'profiles');
const portfolioDir = join(uploadsDir, 'portfolio');

// Ensure directories exist
[dataDir, uploadsDir, profilesDir, portfolioDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

export const paths = {
  dataDir,
  stylistsFile: join(dataDir, 'stylists.json'),
  usersFile: join(dataDir, 'users.json'),
  appointmentsFile: join(dataDir, 'appointments.json'),
  credentialsFile: join(dataDir, 'credentials.json'),
  uploadsDir,
  profilesDir,
  portfolioDir
};
