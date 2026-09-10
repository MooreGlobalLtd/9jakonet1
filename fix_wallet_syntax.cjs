const fs = require('fs');
let file = fs.readFileSync('src/pages/Wallet.tsx', 'utf-8');

// I need to add the missing closing divs that I accidentally removed.
// The structure was:
//         </div> {/* closes space-y-6 */}
//       )} {/* closes !isCustomer */}
//     </div> {/* closes md:col-span-2 */}
//   </div> {/* closes grid md:grid-cols-3 */}
// </div> {/* closes max-w-6xl mx-auto */}
//
// wait, the "Bank Details Form" is inside the !isCustomer block.
// So let's look at the end of the Bank Details form in the current file.

const regex = /                      \{savingBank \? 'Saving\.\.\.' : 'Save Bank for Direct Payouts'\}\s*<\/Button>\s*<\/div>\s*<\/form>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>/s;

const replacement = `                      {savingBank ? 'Saving...' : 'Save Bank for Direct Payouts'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
            </div>
          )}
        </div>
      </div>
`;
file = file.replace(regex, replacement);
fs.writeFileSync('src/pages/Wallet.tsx', file);
console.log("Appended missing divs");
