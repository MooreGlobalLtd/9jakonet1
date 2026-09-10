const fs = require('fs');
let file = fs.readFileSync('src/pages/VerificationKYC.tsx', 'utf-8');

file = file.replace(
  "const [isCameraActive, setIsCameraActive] = useState(false);",
  "const [isCameraActive, setIsCameraActive] = useState(false);\n  const [isScanning, setIsScanning] = useState(false);\n  const [scanCountdown, setScanCountdown] = useState<number | null>(null);"
);

const targetStart = `      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }`;
const replacementStart = `      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setScanCountdown(3);
      }`;
file = file.replace(targetStart, replacementStart);

const targetStop = `  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };`;
const replacementStop = `  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
    setScanCountdown(null);
  };`;
file = file.replace(targetStop, replacementStop);

const targetEffect = `  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);`;
const replacementEffect = `  useEffect(() => {
    let timer: any;
    if (isScanning && scanCountdown !== null) {
      if (scanCountdown > 0) {
        timer = setTimeout(() => setScanCountdown(prev => prev! - 1), 1000);
      } else if (scanCountdown === 0) {
        captureSelfie();
        setIsScanning(false);
        setScanCountdown(null);
      }
    }
    return () => clearTimeout(timer);
  }, [isScanning, scanCountdown]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      setIsScanning(false);
      setScanCountdown(null);
    };
  }, []);`;
file = file.replace(targetEffect, replacementEffect);

const targetOval = `{/* Face outline oval guide */}
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 rounded-full mx-12 my-6 pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-emerald-300 font-semibold bg-black/60 px-2 py-0.5 rounded-full">
                      Align your face here
                    </span>
                  </div>`;
const replacementOval = `{/* Face outline oval guide */}
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 rounded-[100px] mx-12 my-6 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
                    {isScanning && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_10px_2px_#34d399] animate-[pulse_1s_infinite]" style={{ animation: 'bounce 2s infinite' }} />
                    )}
                    <span className="text-[10px] text-emerald-300 font-semibold bg-black/60 px-2 py-0.5 rounded-full z-10">
                      Align your face here
                    </span>
                  </div>`;
file = file.replace(targetOval, replacementOval);

const targetUI = `<div className="flex justify-center gap-3 pt-2">
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6"
                    onClick={captureSelfie}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Snap Selfie Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-slate-300 hover:text-white"
                    onClick={stopCamera}
                  >
                    Cancel
                  </Button>
                </div>`;
const replacementUI = `<div className="flex flex-col items-center justify-center pt-2">
                  {isScanning && scanCountdown !== null && (
                    <div className="mb-2 text-center">
                      <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider animate-pulse">Liveness Check</p>
                      <div className="text-3xl font-black text-white mt-1">
                        {scanCountdown > 0 ? scanCountdown : 'Capturing...'}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Hold still inside the frame</p>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    className="text-slate-300 hover:text-white h-8 text-xs mt-2"
                    onClick={stopCamera}
                  >
                    Cancel Scanning
                  </Button>
                </div>`;
file = file.replace(targetUI, replacementUI);

fs.writeFileSync('src/pages/VerificationKYC.tsx', file);
