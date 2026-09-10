import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkxGlvAG362J0yUBJLKpZp3BGy57vBY38",
  authDomain: "jakonet-c751d.firebaseapp.com",
  projectId: "jakonet-c751d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  try {
    await sendPasswordResetEmail(auth, "info@mooregloballtd.online");
    console.log("Password reset email sent successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}
run();
