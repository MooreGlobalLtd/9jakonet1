const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

const oldHandleGoogleRegex = /const handleGoogleLogin = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/m;

const newHandleGoogle = `const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await signInWithPopup(auth, googleProvider);
      
      // For now: Authenticate users only, Do NOT save user profile data
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setErrorMessage("Google Sign-In failed: " + (error.message || "Please use email and password above."));
      }
    } finally {
      setLoading(false);
    }
  };`;

if (oldHandleGoogleRegex.test(code)) {
  code = code.replace(oldHandleGoogleRegex, newHandleGoogle);
  fs.writeFileSync('src/pages/Login.tsx', code);
  console.log("Updated Google Login");
} else {
  console.log("Regex not found in Google Login");
}
