import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Toaster } from 'sonner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  role: 'admin' | 'staff' | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, role: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("App initialized, starting auth check...");
    
    // Safety timeout to prevent infinite loading state
    const timeout = setTimeout(() => {
      console.warn("Auth check timed out after 8s, forcing load...");
      setLoading(false);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log("Auth state changed:", user ? "User found" : "No user");
        if (user) {
          setUser(user);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setRole(data.role);
          } else {
            // Default role for new staff (first user is admin based on email in rules)
            const isDefaultAdmin = user.email === 'mhsalik47@gmail.com';
            const newRole = isDefaultAdmin ? 'admin' : 'staff';
            const initialData = {
              uid: user.uid,
              email: user.email || '',
              phoneNumber: user.phoneNumber || '',
              displayName: user.displayName || user.phoneNumber || 'Staff Member',
              role: newRole,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), initialData);
            setUserData(initialData);
            setRole(newRole);
          }
        } else {
          setUser(null);
          setUserData(null);
          setRole(null);
        }
      } catch (err: any) {
        console.error('Auth State Change Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-red-100 max-w-md">
          <h1 className="text-2xl font-black text-stone-900 mb-4">Initial Load Failed</h1>
          <p className="text-stone-500 mb-6 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-stone-800 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-50 gap-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
        <div className="text-stone-400 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Portal...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userData, role, loading }}>
      <BrowserRouter>
        <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
