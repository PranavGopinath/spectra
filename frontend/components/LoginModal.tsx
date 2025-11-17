'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User as UserIcon } from 'lucide-react';
import { createUser, UserResponse } from '@/lib/api';
import { setCurrentUser } from '@/lib/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserResponse) => void;
  canClose?: boolean; // Allow preventing modal from being closed
}

export default function LoginModal({ isOpen, onClose, onLogin, canClose = true }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await createUser({ email, username: username || undefined });
      setCurrentUser(user);
      onLogin(user);
      onClose();
      setEmail('');
      setUsername('');
    } catch (err) {
      console.error('Create user error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={canClose ? onClose : undefined}
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 ${canClose ? 'cursor-pointer' : ''}`}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md w-full relative">
              {canClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <h2 className="text-3xl font-bold gradient-text mb-2">Welcome to Spectra</h2>
              <p className="text-white/60 mb-6">Create an account to save your ratings and get personalized recommendations</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/20 glass backdrop-blur-xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Username (optional)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/20 glass backdrop-blur-xl bg-white/5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="Choose a username"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading || !email}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/50"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </motion.button>
              </form>

              <p className="text-xs text-white/40 mt-4 text-center">
                By creating an account, you can rate items and build your personalized taste profile
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

