import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Scissors, Sparkles, User, Store, ShieldCheck } from 'lucide-react';
import { SignInButton } from '@clerk/clerk-react';

const isClerkActive = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || (import.meta.env as any).NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/explore';

  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await login(identifier, password);
      if (user.role === 'BUSINESS') navigate('/tailor/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async (type: 'customer' | 'tailor' | 'admin') => {
    setIsLoading(true);
    setError(null);
    try {
      await loginAsDemo(type);
      if (type === 'tailor') navigate('/tailor/dashboard');
      else if (type === 'admin') navigate('/admin/dashboard');
      else navigate('/app/orders');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center mx-auto shadow-md mb-3">
            <Scissors className="w-6 h-6 -rotate-45" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            Sign in to TailorConnect
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Access your custom stitching requests, quotes, and timeline tracking.
          </p>
        </div>

        {/* Instant Demo Accounts (1-Click Login) */}
        {import.meta.env.VITE_ENABLE_DEMO_BAR !== 'false' && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Instant Test Accounts (1-Click Sign In)</span>
            </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoClick('customer')}
              className="w-full p-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-left flex items-center justify-between text-stone-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="font-bold">Customer: Priya Sharma</p>
                  <p className="text-[11px] text-stone-500">Active bridal blouse order with timeline</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('tailor')}
              className="w-full p-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-left flex items-center justify-between text-stone-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-800" />
                <div>
                  <p className="font-bold">Tailor: Meera Boutique</p>
                  <p className="text-[11px] text-stone-500">Banjara Hills studio, requests & cutting workbench</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoClick('admin')}
              className="w-full p-2.5 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-left flex items-center justify-between text-stone-800 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <div>
                  <p className="font-bold">Platform Administrator</p>
                  <p className="text-[11px] text-stone-500">Verify businesses & inspect all order audits</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Sign In</span>
            </button>
          </div>
        </div>
        )}

        {/* Standard Login Form */}
        <Card>
          <CardContent className="pt-6">
            {isClerkActive && (
              <div className="mb-5">
                <SignInButton>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2.5 border-stone-300 hover:bg-stone-50 py-2.5 text-stone-800 shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-semibold text-sm">Sign in with Google / Clerk</span>
                  </Button>
                </SignInButton>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-stone-400 font-medium">Or continue with password</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email or Phone Number"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. priya.sharma@example.com"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              {error && (
                <p className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">{error}</p>
              )}

              <Button type="submit" size="md" className="w-full" isLoading={isLoading}>
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-stone-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-slate-900 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
