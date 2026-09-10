import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkxGlvAG362J0yUBJLKpZp3BGy57vBY38",
  authDomain: "jakonet-c751d.firebaseapp.com",
  projectId: "jakonet-c751d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  const email = "info@mooregloballtd.online";
  const password = "AdminPassword123!";
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Account created successfully!");
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Account already exists. Please tell user to use 'Forgot Password'.");
    } else {
      console.error("Error:", error.message);
    }
  }
}
run();
