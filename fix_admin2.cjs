const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp({
  credential: applicationDefault(),
  projectId: 'ai-studio-6f3c4724-d72d-43d4-9474-7d55fcdddb52'
});

async function run() {
  try {
    const userRecord = await getAuth().getUserByEmail('info@mooregloballtd.online');
    console.log('User found:', userRecord.uid);
    await getAuth().updateUser(userRecord.uid, {
      password: 'AdminPassword123!'
    });
    console.log('Password updated successfully to: AdminPassword123!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
