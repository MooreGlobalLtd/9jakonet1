const fs = require('fs');
let content = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');
const lines = content.split('\\n');

// The problematic block is around lines 464-477
// We want it to be:
//                 </form>
//               </div>
//             </div>
//         </div>
//       </div>
//     </div>
//
//       {/* History Sections */}
//         <div className="mt-12">

let newLines = [];
for (let i = 0; i < lines.length; i++) {
  if (i >= 464 && i <= 477) {
     if (i === 464) newLines.push('              </div>');
     if (i === 465) newLines.push('            </div>');
     if (i === 466) newLines.push('        </div>');
     if (i === 467) newLines.push('      </div>');
     if (i === 468) newLines.push('    </div>');
     if (i === 469) newLines.push('');
     if (i === 470) newLines.push('      {/* History Sections */}');
     if (i === 471) newLines.push('        <div className="mt-12">');
     // ignore the rest
  } else {
     newLines.push(lines[i]);
  }
}
fs.writeFileSync('src/pages/Wallet.tsx', newLines.join('\\n'));
