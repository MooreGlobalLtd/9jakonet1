const fs = require('fs');
let code = fs.readFileSync('src/pages/Register.tsx', 'utf-8');

const oldHandleSignupRegex = /const handleEmailSignup = async [\s\S]*?setLoading\(false\);\n    \}\n  \};/m;

const newHandleSignup = `const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || loading) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // For now: Authenticate users only, Do NOT save user profile data
      // Flow: On successful sign-in or sign-up, redirect to the dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Signup error:", error);
      // If the email already exists, show exact message: "User already exists. Please sign in"
      if (error?.code === 'auth/email-already-in-use') {
        setErrorMessage("User already exists. Please sign in");
      } else {
        setErrorMessage(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };`;

if (oldHandleSignupRegex.test(code)) {
  code = code.replace(oldHandleSignupRegex, newHandleSignup);
  fs.writeFileSync('src/pages/Register.tsx', code);
  console.log("Updated Register");
} else {
  console.log("Regex not found in Register");
}
