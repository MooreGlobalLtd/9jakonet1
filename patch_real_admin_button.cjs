const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

// The old function block
const oldSaveEnd = `
      toast.info('✅ Paystack configuration saved successfully! Keys are safely stored and active for automated bank payouts.');
      checkLiveBalance();
    } catch (error: any) {
`;

const newSaveEnd = `
      toast.success('Configuration saved successfully!');
      setSaveStatus('Saved!');
      checkLiveBalance();
    } catch (error: any) {
`;

file = file.replace(oldSaveEnd.trim(), newSaveEnd.trim());

const oldCatchEnd = `
      } else {
        toast.error('Failed to save configuration.');
        console.error('Save config error:', error);
      }
    }
  };
`;

const newCatchEnd = `
      } else {
        toast.error('Failed to save configuration.');
        console.error('Save config error:', error);
      }
    } finally {
      setIsSavingConfig(false);
    }
  };
`;

file = file.replace(oldCatchEnd.trim(), newCatchEnd.trim());

const oldInputs = `
                <input 
                  type="password" 
                  placeholder="re_xxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs mb-1"
                  value={resendKeyInput}
                  onChange={(e) => setResendKeyInput(e.target.value)}
                />
`;

const newInputs = `
                <input 
                  type="password" 
                  placeholder="re_xxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs mb-1"
                  value={resendKeyInput}
                  onChange={(e) => {
                    setResendKeyInput(e.target.value);
                    setSaveStatus('Save Configuration');
                  }}
                />
`;

file = file.replace(oldInputs.trim(), newInputs.trim());

const oldPaystackPublic = `
                <input 
                  type="text" 
                  placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                  value={paystackKeyInput}
                  onChange={(e) => setPaystackKeyInput(e.target.value)}
                />
`;
const newPaystackPublic = `
                <input 
                  type="text" 
                  placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                  value={paystackKeyInput}
                  onChange={(e) => {
                    setPaystackKeyInput(e.target.value);
                    setSaveStatus('Save Configuration');
                  }}
                />
`;
file = file.replace(oldPaystackPublic.trim(), newPaystackPublic.trim());

const oldPaystackSecret = `
                <input 
                  type="password" 
                  placeholder="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                  value={paystackSecretInput}
                  onChange={(e) => setPaystackSecretInput(e.target.value)}
                />
`;
const newPaystackSecret = `
                <input 
                  type="password" 
                  placeholder="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                  value={paystackSecretInput}
                  onChange={(e) => {
                    setPaystackSecretInput(e.target.value);
                    setSaveStatus('Save Configuration');
                  }}
                />
`;
file = file.replace(oldPaystackSecret.trim(), newPaystackSecret.trim());

const oldButton = `<Button 
                  onClick={handleSavePaystackSettings}
                >
                  Save Paystack Configuration
                </Button>`;

const newButton = `<Button 
                  onClick={handleSavePaystackSettings}
                  disabled={isSavingConfig}
                  className={saveStatus === 'Saved!' ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  {saveStatus}
                </Button>`;

file = file.replace(oldButton, newButton);

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
console.log("Patched real Admin button state");
