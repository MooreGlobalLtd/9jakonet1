const fs = require('fs');
let code = fs.readFileSync('src/pages/Register.tsx', 'utf-8');

const oldHandleGoogleRegex = /const handleGoogleSignup = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/m;

const newHandleGoogle = `const handleGoogleSignup = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await signInWithPopup(auth, googleProvider);
      // For now: Authenticate users only, Do NOT save user profile data
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Google Signup error:", error);
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setErrorMessage(error.message || "Failed to sign up with Google");
      }
    } finally {
      setLoading(false);
    }
  };`;

if (oldHandleGoogleRegex.test(code)) {
  code = code.replace(oldHandleGoogleRegex, newHandleGoogle);
  fs.writeFileSync('src/pages/Register.tsx', code);
  console.log("Updated Google Signup");
} else {
  console.log("Regex not found for Google Signup");
}
