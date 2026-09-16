const fs = require('fs');
let content = fs.readFileSync('src/pages/Wallet.tsx', 'utf8');

const target = `                </form>
              </div>
            </div>
          )}
        </div>
      </div>
            </div>
          )}
        </div>
      </div>


      {/* History Sections */}
      {!isCustomer && (
        <div className="mt-12">`;

const replacement = `                </form>
              </div>
            </div>
        </div>
      </div>
    </div>

      {/* History Sections */}
        <div className="mt-12">`;

// If target doesn't match exactly because of my previous script, I'll just use Regex or simpler strings.
