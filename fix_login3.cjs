const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

// Add sendEmailVerification and signOut to import
code = code.replace(/import \{ signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail \} from 'firebase\/auth';/, "import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, sendEmailVerification, signOut as firebaseSignOut } from 'firebase/auth';");

// Add verification state
code = code.replace(/const \[showPassword, setShowPassword\] = useState\(false\);/, "const [showPassword, setShowPassword] = useState(false);\n  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);");

// Replace handleEmailLogin body
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
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // If a user logs in and their email is not verified, block access and show the verification screen.
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        setUnverifiedEmail(email.trim());
        return;
      }
      
      // For now: Authenticate users only, Do NOT save user profile data or read from Firestore
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-login-credentials') {
        setErrorMessage("Email or password is incorrect");
      } else {
        setErrorMessage(error.message || "Email or password is incorrect");
      }
    } finally {
      setLoading(false);
    }
  };`;
code = code.replace(oldHandleLoginRegex, newHandleLogin);

// Add early return for verification screen
const earlyReturnCode = `  // Verification Screen
  if (unverifiedEmail) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4 py-8 bg-slate-50/50">
        <Card className="w-full max-w-md shadow-md border-slate-200 text-center py-10 px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Mail className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 mb-3">Verify your email</CardTitle>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            We have sent you a verification email to <span className="font-semibold text-slate-900">{unverifiedEmail}</span>. Please verify it and log in.
          </p>
          <Button 
            onClick={() => {
              setUnverifiedEmail(null);
              setPassword('');
            }} 
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

fs.writeFileSync('src/pages/Login.tsx', code);
console.log("Updated Login verification flow");
