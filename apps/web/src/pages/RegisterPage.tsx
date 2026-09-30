import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Scissors, User, Store } from 'lucide-react';
import { SignUpButton } from '@clerk/clerk-react';

const isClerkActive = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || (import.meta.env as any).NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'BUSINESS' ? 'BUSINESS' : 'CUSTOMER';

  const [role, setRole] = useState<'CUSTOMER' | 'BUSINESS'>(defaultRole);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await register({
        role,
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        password,
      });

      if (user.role === 'BUSINESS') {
        navigate('/tailor/dashboard');
      } else {
        navigate('/explore');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center mx-auto shadow-md mb-3">
            <Scissors className="w-6 h-6 -rotate-45" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            Create an Account
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-1">
            Join TailorConnect as a Customer or Bespoke Tailor / Boutique Studio.
          </p>
        </div>

        {/* Account Type Selector (Customer vs Business) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === 'CUSTOMER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4 text-amber-600" />
            I'm a Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('BUSINESS')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === 'BUSINESS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-4 h-4 text-slate-900" />
            I'm a Tailor / Studio
          </button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isClerkActive && (
              <div className="mb-5">
                <SignUpButton fallbackRedirectUrl={typeof window !== 'undefined' ? window.location.origin : '/'}>
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
                    <span className="font-semibold text-sm">Quick Sign Up with Google / Clerk</span>
                  </Button>
                </SignUpButton>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-stone-400 font-medium">Or register with phone & password</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Priya"
                  required
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                />
              </div>

              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                required
              />

              <Input
                label="Email Address (Optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@example.com"
              />

              <Input
                label="Create Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />

              {error && (
                <p className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">{error}</p>
              )}

              <Button type="submit" size="md" className="w-full" isLoading={isLoading}>
                {role === 'CUSTOMER' ? 'Register as Customer' : 'Register Studio'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-900 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
