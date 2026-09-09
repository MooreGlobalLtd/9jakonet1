const fs = require('fs');
let code = fs.readFileSync('src/pages/Register.tsx', 'utf-8');

// Add sendEmailVerification and signOut to import
code = code.replace(/import \{ \n  createUserWithEmailAndPassword, \n  signInWithPopup,\n  updateProfile\n\} from 'firebase\/auth';/, "import { \n  createUserWithEmailAndPassword, \n  signInWithPopup,\n  updateProfile,\n  sendEmailVerification,\n  signOut as firebaseSignOut\n} from 'firebase/auth';");

// Add verification state
code = code.replace(/const \[showPassword, setShowPassword\] = useState\(false\);/, "const [showPassword, setShowPassword] = useState(false);\n  const [verificationEmailSent, setVerificationEmailSent] = useState<string | null>(null);");

// Replace handleEmailSignup body
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
      
      // 2. Send verification email
      await sendEmailVerification(userCredential.user);
      
      // 3. Do not sign them in automatically
      await firebaseSignOut(auth);
      
      // 4. Show verification screen
      setVerificationEmailSent(email.trim());
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error?.code === 'auth/email-already-in-use') {
        setErrorMessage("User already exists. Please sign in");
      } else {
        setErrorMessage(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };`;
code = code.replace(oldHandleSignupRegex, newHandleSignup);

// Add early return for verification screen
const earlyReturnCode = `  // Verification Screen
  if (verificationEmailSent) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4 py-8 bg-slate-50/50">
        <Card className="w-full max-w-md shadow-md border-slate-200 text-center py-10 px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 mb-3">Check your inbox</CardTitle>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            We have sent you a verification email to <span className="font-semibold text-slate-900">{verificationEmailSent}</span>. Please verify it and log in.
          </p>
          <Button 
            onClick={() => navigate('/login')} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
          >
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  return (`;
code = code.replace(/return \(\n    <div className="flex min-h/, earlyReturnCode + '\n    <div className="flex min-h');

fs.writeFileSync('src/pages/Register.tsx', code);
console.log("Updated Register verification flow");
