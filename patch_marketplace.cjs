const fs = require('fs');
let content = fs.readFileSync('src/pages/Marketplace.tsx', 'utf8');

// 1. Add new icons to imports
content = content.replace(
  "import { Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, ShoppingBag, ShieldCheck } from 'lucide-react';",
  "import { Store, MapPin, Tag, Plus, Loader2, X, Phone, Navigation, MessageCircle, ShoppingBag, ShieldCheck, Car, Smartphone, Laptop, Sofa, Shirt, Home, MoreHorizontal } from 'lucide-react';"
);

// 2. Add category filter state
content = content.replace(
  "const [search, setSearch] = useState('');",
  `const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const visualCategories = [
    { name: 'All', icon: <Store className="w-5 h-5" /> },
    { name: 'Vehicles', icon: <Car className="w-5 h-5" /> },
    { name: 'Electronics', icon: <Smartphone className="w-5 h-5" /> },
    { name: 'Computers', icon: <Laptop className="w-5 h-5" /> },
    { name: 'Furniture', icon: <Sofa className="w-5 h-5" /> },
    { name: 'Fashion', icon: <Shirt className="w-5 h-5" /> },
    { name: 'Properties', icon: <Home className="w-5 h-5" /> },
    { name: 'Other', icon: <MoreHorizontal className="w-5 h-5" /> },
  ];`
);

// 3. Update filtering logic
content = content.replace(
  `  const filteredItems = items.filter(item => 
    item.status === 'active' &&
    (item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.state.toLowerCase().includes(search.toLowerCase()) ||
    item.city.toLowerCase().includes(search.toLowerCase()))
  );`,
  `  const filteredItems = items.filter(item => 
    item.status === 'active' &&
    (selectedCategory === 'All' || item.category.toLowerCase().includes(selectedCategory.toLowerCase()) || selectedCategory.toLowerCase().includes(item.category.toLowerCase())) &&
    (item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.state.toLowerCase().includes(search.toLowerCase()) ||
    item.city.toLowerCase().includes(search.toLowerCase()))
  );`
);

// 4. Update Header and Search section to include the category pills
const searchBlock = `{/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search for phones, cars, furniture, or your city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200"
            />
          </div>
        </div>`;

const searchBlockReplacement = `{/* Search & Categories */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-4">
          <div className="flex-1">
            <Input 
              placeholder="Search for phones, cars, furniture, or your city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200"
            />
          </div>
          
          {/* Horizontal scrollable categories */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {visualCategories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={\`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors \${
                  selectedCategory === cat.name 
                    ? 'bg-emerald-100 text-emerald-800 font-semibold border-emerald-200' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                } border\`}
              >
                {cat.icon}
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>`;
content = content.replace(searchBlock, searchBlockReplacement);

// 5. Update Grid columns and add "Just Listed" badge
const gridBlock = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">`;
const gridBlockReplacement = `<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">`;
content = content.replace(gridBlock, gridBlockReplacement);

const titleClass = `<h3 className="font-semibold text-slate-900 line-clamp-1 flex-1">{item.title}</h3>`;
const titleClassReplacement = `<h3 className="font-semibold text-slate-900 line-clamp-1 flex-1 text-sm sm:text-base">{item.title}</h3>`;
content = content.replace(titleClass, titleClassReplacement);

const priceClass = `<p className="text-xl font-bold text-emerald-600 mb-3">₦{item.price.toLocaleString()}</p>`;
const priceClassReplacement = `<p className="text-lg sm:text-xl font-bold text-emerald-600 mb-3">₦{item.price.toLocaleString()}</p>`;
content = content.replace(priceClass, priceClassReplacement);

// Find the image wrapper to add the Just Listed badge
const imgWrapper = `<div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={item.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {item.condition}
                  </div>
                </div>`;

const imgWrapperReplacement = `<div className="relative h-36 sm:h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={item.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* FB Style Just Listed Badge */}
                  {(Date.now() - item.createdAt) < (24 * 60 * 60 * 1000) && (
                    <div className="absolute top-2 left-2 bg-emerald-600/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] sm:text-xs font-semibold text-white tracking-wide shadow-sm">
                      Just listed
                    </div>
                  )}

                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {item.condition}
                  </div>
                </div>`;
content = content.replace(imgWrapper, imgWrapperReplacement);

fs.writeFileSync('src/pages/Marketplace.tsx', content);
