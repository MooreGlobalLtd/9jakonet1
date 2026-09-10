const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

file = file.replace(
  "{['Barber', 'Plumber', 'Electrician', 'Doctor', 'Cleaner', 'Mechanic'].map(cat => (",
  "{['AC Technician', 'Tailor', 'Plumber', 'Electrician', 'Cleaner', 'Mechanic', 'Carpenter'].map(cat => ("
);

fs.writeFileSync('src/pages/Explore.tsx', file);
