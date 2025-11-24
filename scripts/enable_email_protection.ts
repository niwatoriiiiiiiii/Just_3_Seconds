import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service account key
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

// Check if the key file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account-key.json not found in the project root.');
  console.error('Please download it from Firebase Console > Project Settings > Service Accounts and save it as service-account-key.json');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountData);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function enableEmailEnumerationProtection() {
  try {
    console.log('Updating project configuration...');
    
    // Update the project configuration
    await admin.auth().projectConfigManager().updateProjectConfig({
      emailPrivacyConfig: {
        enableImprovedEmailPrivacy: true,
      },
    });

    console.log('✅ Successfully enabled Email Enumeration Protection!');
    console.log('The server will now return the same response time regardless of whether a user exists.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating project configuration:', error);
    process.exit(1);
  }
}

enableEmailEnumerationProtection();
