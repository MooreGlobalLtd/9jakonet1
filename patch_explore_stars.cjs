const fs = require('fs');
let file = fs.readFileSync('src/pages/Explore.tsx', 'utf-8');

const renderStarsFunc = `
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={\`h-4 w-4 \${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}\`} 
          />
        ))}
      </div>
    );
  };
`;

if (!file.includes("const renderStars")) {
    file = file.replace(/const handleMessageArtisan = async/, renderStarsFunc + '\n  const handleMessageArtisan = async');
}

// Replace the card stars
const cardStarTarget = `<Star className="mr-2 h-4 w-4 text-amber-400 fill-amber-400" />
                      <span>{artisan.ratingAvg > 0 ? artisan.ratingAvg : 'New'} ({artisan.totalJobsDone} jobs)</span>`;

const cardStarReplacement = `{renderStars(artisan.ratingAvg > 0 ? artisan.ratingAvg : 5)}
                      <span className="ml-2 font-medium">{artisan.ratingAvg > 0 ? artisan.ratingAvg.toFixed(1) : 'New'}</span>
                      <span className="ml-1 text-slate-500">({artisan.totalJobsDone} jobs)</span>`;
file = file.replace(cardStarTarget, cardStarReplacement);

// Replace modal stars
const modalStarTarget = `<Star className="mr-1 h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-slate-900 mr-1">{selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg.toFixed(1) : '5.0'}</span>
                    <span>({selectedArtisan.totalJobsDone > 0 ? selectedArtisan.totalJobsDone : 0} reviews)</span>`;

const modalStarReplacement = `{renderStars(selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg : 5)}
                    <span className="font-bold text-slate-900 ml-2 mr-1">{selectedArtisan.ratingAvg > 0 ? selectedArtisan.ratingAvg.toFixed(1) : '5.0'}</span>
                    <span className="text-slate-500">({selectedArtisan.totalJobsDone > 0 ? selectedArtisan.totalJobsDone : 0} reviews)</span>`;
file = file.replace(modalStarTarget, modalStarReplacement);

fs.writeFileSync('src/pages/Explore.tsx', file);
