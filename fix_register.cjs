const fs = require('fs');
let code = fs.readFileSync('src/pages/Register.tsx', 'utf8');

const verificationScreen = `
  if (verificationEmailSent) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 shadow-sm border-slate-200">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="mb-3 text-2xl font-bold text-slate-900">Check Your Email</CardTitle>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 text-left">
            <h4 className="font-semibold text-amber-800 text-sm mb-1 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Important Warning
            </h4>
            <p className="text-sm text-amber-700">
              We just sent a verification link to <strong>{verificationEmailSent}</strong>.
              <br/><br/>
              <strong>Did not see it?</strong> Please check your <strong>Spam or Junk folder</strong> immediately. It might be hiding there! If it is, mark it as "Not Spam".
            </p>
          </div>
          <Button className="w-full h-11" onClick={() => navigate('/login')}>
            Go to Login Page
          </Button>
        </Card>
      </div>
    );
  }
`;

code = code.replace(
  "  if (currentUser) {",
  verificationScreen + "\n  if (currentUser) {"
);

fs.writeFileSync('src/pages/Register.tsx', code);
console.log('Fixed Register.tsx');
