const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'ai-studio-6f3c4724-d72d-43d4-9474-7d55fcdddb52'
});
const db = admin.firestore();

async function check() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', 'info@mooregloballtd.online').get();
  if (snapshot.empty) {
    console.log('No matching documents.');
    return;
  }
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}
check();
