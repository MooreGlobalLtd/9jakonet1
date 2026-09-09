const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// Add saving state to the AdminDashboard
file = file.replace("const [checkingBalance, setCheckingBalance] = useState(false);", 
`const [checkingBalance, setCheckingBalance] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Save Configuration');`);

// Update the handleSavePaystackSettings function
const oldSaveFunc = `
  const handleSavePaystackSettings = async () => {
    const cleanPublic = paystackKeyInput.trim();
    const cleanSecret = paystackSecretInput.trim();
    const cleanResend = resendKeyInput.trim();

    if (!cleanPublic && !cleanSecret && !cleanResend) {
      toast.info('Please enter your configuration keys');
      return;
    }

    try {
`;

const newSaveFunc = `
  const handleSavePaystackSettings = async () => {
    const cleanPublic = paystackKeyInput.trim();
    const cleanSecret = paystackSecretInput.trim();
    const cleanResend = resendKeyInput.trim();

    if (!cleanPublic && !cleanSecret && !cleanResend) {
      toast.info('Please enter your configuration keys');
      return;
    }

    setIsSavingConfig(true);
    setSaveStatus('Saving...');
    try {
`;

file = file.replace(oldSaveFunc.trim(), newSaveFunc.trim());

// Update the end of the save function
const oldSaveEnd = `
      toast.success('Configuration saved successfully!');
    } catch (err) {
      console.error('Failed to save config:', err);
      toast.error('Failed to save configuration');
    }
  };
`;

const newSaveEnd = `
      toast.success('Configuration saved successfully!');
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus('Save Configuration'), 3000);
    } catch (err) {
      console.error('Failed to save config:', err);
      toast.error('Failed to save configuration');
      setSaveStatus('Save Configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };
`;

file = file.replace(oldSaveEnd.trim(), newSaveEnd.trim());

// Update the button UI
const oldBtn = `<Button onClick={handleSavePaystackSettings} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  Save Paystack Configuration
                </Button>`;

const newBtn = `<Button 
                  onClick={handleSavePaystackSettings} 
                  disabled={isSavingConfig}
                  className={\`w-full \${saveStatus === 'Saved!' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'}\`}
                >
                  {saveStatus}
                </Button>`;

file = file.replace(oldBtn, newBtn);

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Patched Admin button state");
