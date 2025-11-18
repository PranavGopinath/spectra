'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Library, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ChatInterface from './ChatInterface';
import LibraryView from './LibraryView';
import ProfileView from './ProfileView';
import LoginModal from './LoginModal';
import { BackgroundVisuals } from './background-visuals';
import { SpectraLogo } from './SpectraLogo';
import { getCurrentUser, logout as authLogout } from '@/lib/auth';
import { UserResponse } from '@/lib/api';

type Tab = 'discover' | 'library' | 'profile';

export default function AppLayout() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [user, setUser] = useState<UserResponse | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setShowLoginModal(true);
      }
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, []);

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setShowLoginModal(true);
  };

  const tabs = [
    { id: 'discover' as Tab, label: 'Discover', icon: Compass },
    { id: 'library' as Tab, label: 'Library', icon: Library },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
  ];

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundVisuals />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user && !isCheckingAuth) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <BackgroundVisuals />
        <div className="relative z-10 flex items-center justify-center h-screen px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl"
          >
            <div className="flex justify-center mb-4">
              <SpectraLogo size="lg" animated={true} />
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              Discover movies, music, and books that match your unique taste profile
            </p>
            <p className="text-muted-foreground mb-8">
              Sign in to get started with personalized recommendations
            </p>
          </motion.div>
        </div>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {}}
          canClose={false}
          onLogin={async (newUser) => {
            setUser(newUser);
            setShowLoginModal(false);
          }}
          onRegistrationSuccess={async (newUser) => {
            setUser(newUser);
            setShowLoginModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundVisuals />
      
      <div className="relative z-10 flex h-screen">
        {/* Sidebar Navigation - Dedicated space, no background/border */}
        <aside className="w-64 flex flex-col items-center py-6 px-4 relative">
          {/* Logo - Top */}
          <div className="mb-auto">
            <SpectraLogo size="sm" animated={true} />
          </div>

          {/* Navigation Tabs - Centered Vertically */}
          <nav className="flex flex-col gap-3 absolute top-1/2 -translate-y-1/2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/30'
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* User Info & Logout - Bottom */}
          {user && (
            <div className="flex flex-col items-center gap-3 mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {user.username}
                </p>
              </div>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-card/30 transition-colors text-sm text-muted-foreground hover:text-foreground"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'discover' && user && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-hidden"
              >
                <ChatInterface userId={user.id} />
              </motion.div>
            )}
            
            {activeTab === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-hidden"
              >
                <LibraryView userId={user?.id || ''} />
              </motion.div>
            )}
            
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 overflow-hidden"
              >
                <ProfileView userId={user?.id || ''} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Login Modal (for logout/login flow) */}
      <LoginModal
        isOpen={showLoginModal && !!user}
        onClose={() => setShowLoginModal(false)}
        canClose={true}
        onLogin={(newUser) => {
          setUser(newUser);
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}

