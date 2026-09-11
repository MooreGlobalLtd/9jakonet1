const fs = require('fs');
let code = fs.readFileSync('src/pages/LogoPreview.tsx', 'utf8');
code = code.replace("const DOMURL = window.URL || window.webkitURL || window;", "");
code = code.replace("const url = DOMURL.createObjectURL(svgBlob);", "const url = URL.createObjectURL(svgBlob);");
code = code.replace("DOMURL.revokeObjectURL(url);", "URL.revokeObjectURL(url);");
fs.writeFileSync('src/pages/LogoPreview.tsx', code);
console.log('Fixed LogoPreview');
