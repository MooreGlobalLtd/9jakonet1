const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const promptDialogJSX = `
      {/* Prompt Dialog */}
      {promptDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Provide Details</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">
              {promptDialog.message}
            </p>
            <textarea
              id="prompt-dialog-input"
              className="w-full min-h-[100px] border border-slate-300 rounded-lg p-3 text-sm focus:border-amber-500 focus:ring-amber-500 mb-6"
              defaultValue={promptDialog.defaultText}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPromptDialog(null)}>Cancel</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => {
                const val = (document.getElementById('prompt-dialog-input') as HTMLTextAreaElement).value;
                if (!val.trim()) {
                   // Let the action handle it or just prevent close
                   promptDialog.action(val);
                   return;
                }
                promptDialog.action(val);
                setPromptDialog(null);
              }}>Submit</Button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "      {/* General Confirm Dialog */}",
  promptDialogJSX + "\n      {/* General Confirm Dialog */}"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
console.log('Fixed AdminDashboard.tsx');
