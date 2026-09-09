const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

const oldHandleLoginRegex = /const handleEmailLogin = async [\s\S]*?setLoading\(false\);\n    \}\n  \};/m;
const newHandleLogin = `const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // For now: Authenticate users only, Do NOT save user profile data or read from Firestore
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      // If credentials are incorrect, show exact message: "Email or password is incorrect"
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-login-credentials') {
        setErrorMessage("Email or password is incorrect");
      } else {
        setErrorMessage(error.message || "Email or password is incorrect");
      }
    } finally {
      setLoading(false);
    }
  };`;

if (oldHandleLoginRegex.test(code)) {
  code = code.replace(oldHandleLoginRegex, newHandleLogin);
  fs.writeFileSync('src/pages/Login.tsx', code);
  console.log("Updated Login");
} else {
  console.log("Regex not found in Login");
}
