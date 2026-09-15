const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// 1. Add resend-config.json persistence
const resendConfigSetup = `
// Local Resend Config Persistence
const RESEND_CONFIG_FILE = path.join(process.cwd(), 'resend-config.json');
let resendConfig = { apiKey: '' };
try {
  if (fs.existsSync(RESEND_CONFIG_FILE)) {
    const raw = fs.readFileSync(RESEND_CONFIG_FILE, 'utf-8');
    resendConfig = JSON.parse(raw);
  }
} catch (e) {
  console.error('Failed to load resend-config.json:', e);
}
`;

content = content.replace('function getPaystackSecretKey(req?: express.Request): string {', resendConfigSetup + '\nfunction getPaystackSecretKey(req?: express.Request): string {');

// 2. Update getResend
const newGetResend = `function getResend(req?: express.Request) {
  const headerKey = req?.headers['x-resend-api-key'] as string;
  let activeKey = (headerKey && headerKey.trim()) ? headerKey.trim() : process.env.RESEND_API_KEY;
  if (!activeKey && resendConfig.apiKey && resendConfig.apiKey.trim()) {
    activeKey = resendConfig.apiKey.trim();
  }
  
  if (activeKey) {
    return new Resend(activeKey);
  }
  return null;
}`;

content = content.replace(/function getResend\([\s\S]*?return null;\n}/, newGetResend);

// 3. Update handleSaveConfig
const oldHandleSaveConfig = `const handleSaveConfig = (req: express.Request, res: express.Response) => {
    const { publicKey, secretKey } = req.body;
    if (publicKey) paystackConfig.publicKey = publicKey.trim();
    if (secretKey) paystackConfig.secretKey = secretKey.trim();
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(paystackConfig, null, 2), 'utf-8');
      res.json({ 
        success: true, 
        message: 'Paystack configuration saved successfully on server!',
        publicKey: getPaystackPublicKey(),
      });
    } catch (error) {
      console.error('Failed to write paystack-config.json:', error);
      res.status(500).json({ success: false, error: 'Failed to save configuration.' });
    }
  };`;

const newHandleSaveConfig = `const handleSaveConfig = (req: express.Request, res: express.Response) => {
    const { publicKey, secretKey, resendKey } = req.body;
    if (publicKey) paystackConfig.publicKey = publicKey.trim();
    if (secretKey) paystackConfig.secretKey = secretKey.trim();
    if (resendKey) resendConfig.apiKey = resendKey.trim();
    
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(paystackConfig, null, 2), 'utf-8');
      fs.writeFileSync(RESEND_CONFIG_FILE, JSON.stringify(resendConfig, null, 2), 'utf-8');
      res.json({ 
        success: true, 
        message: 'Configuration saved successfully on server!',
        publicKey: getPaystackPublicKey(),
      });
    } catch (error) {
      console.error('Failed to write config files:', error);
      res.status(500).json({ success: false, error: 'Failed to save configuration.' });
    }
  };`;

content = content.replace(oldHandleSaveConfig, newHandleSaveConfig);

fs.writeFileSync('server.ts', content);
