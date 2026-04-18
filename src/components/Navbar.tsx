import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { School, LogOut, LayoutDashboard, LogIn } from 'lucide-react';

export default function Navbar() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-stone-900 leading-none">E.V.S. Public School</span>
              </div>
            </Link>

          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-1.5 bg-stone-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-800 transition-all active:scale-95 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
