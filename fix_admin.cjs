const admin = require('firebase-admin');

// We don't have service account credentials easily accessible.
// Let's see if applicationDefault works.
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'ai-studio-6f3c4724-d72d-43d4-9474-7d55fcdddb52'
});

async function run() {
  try {
    const userRecord = await admin.auth().getUserByEmail('info@mooregloballtd.online');
    console.log('User found:', userRecord.uid);
    await admin.auth().updateUser(userRecord.uid, {
      password: 'AdminPassword123!'
    });
    console.log('Password updated successfully to: AdminPassword123!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
