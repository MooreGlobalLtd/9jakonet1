import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} 9jaKonet NG. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
