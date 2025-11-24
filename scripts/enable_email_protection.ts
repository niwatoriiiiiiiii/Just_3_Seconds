
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Path to the service account key
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

// Check if the key file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account-key.json not found in the project root.');
  console.error('Please download it from Firebase Console > Project Settings > Service Accounts and save it as service-account-key.json');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

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

    console.log('Successfully enabled Email Enumeration Protection!');
  } catch (error) {
    console.error('Error updating project configuration:', error);
    process.exit(1);
  }
}

enableEmailEnumerationProtection();
