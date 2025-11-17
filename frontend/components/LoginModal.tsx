'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, User as UserIcon, Lock, Github } from 'lucide-react';
import { register, login, initiateOAuth } from '@/lib/api';
import { setCurrentUser, setAccessToken } from '@/lib/auth';
import { UserResponse } from '@/lib/api';
import { Card } from '@/components/ui/card';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserResponse) => void;
  canClose?: boolean;
}

export default function LoginModal({ isOpen, onClose, onLogin, canClose = true }: LoginModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let result;
      if (isLoginMode) {
        result = await login(email, password);
      } else {
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setIsLoading(false);
          return;
        }
        result = await register(email, password, username || undefined);
      }

      setAccessToken(result.access_token);
      setCurrentUser(result.user);
      onLogin(result.user);
      onClose();
      setEmail('');
      setPassword('');
      setUsername('');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isLoginMode ? 'login' : 'register'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    initiateOAuth(provider);
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
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-card/90 backdrop-blur-md border-border p-8 max-w-md w-full relative shadow-2xl">
              {canClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              <h2 className="text-3xl font-bold text-foreground mb-2">
                {isLoginMode ? 'Welcome Back' : 'Welcome to Spectra'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isLoginMode 
                  ? 'Sign in to continue to your personalized recommendations'
                  : 'Create an account to save your ratings and get personalized recommendations'
                }
              </p>

              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOAuth('google')}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border hover:bg-background/70 transition-all flex items-center justify-center gap-3 text-foreground"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium">Continue with Google</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleOAuth('github')}
                  className="w-full px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border hover:bg-background/70 transition-all flex items-center justify-center gap-3 text-foreground"
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium">Continue with GitHub</span>
                </motion.button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                </div>

                {!isLoginMode && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Username (optional)
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      placeholder="Choose a username"
                      disabled={isLoading}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={isLoginMode ? undefined : 8}
                    className="w-full px-4 py-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder={isLoginMode ? "Enter your password" : "At least 8 characters"}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-destructive/20 border border-destructive/50 text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/50"
                >
                  {isLoading 
                    ? (isLoginMode ? 'Signing in...' : 'Creating account...')
                    : (isLoginMode ? 'Sign In' : 'Create Account')
                  }
                </motion.button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(!isLoginMode);
                    setError(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLoginMode 
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
