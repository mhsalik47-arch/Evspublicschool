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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
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
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard /> : <Navigate to="/login" />} 
              />
            </Routes>
          </main>
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
