import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { User, MapPin, Bell, Shield, LogOut } from 'lucide-react';

export function CustomerProfilePage() {
  const { user, logout } = useAuth();
  const [city, setCity] = useState(user?.profile?.city || 'Hyderabad');
  const [locality, setLocality] = useState(user?.profile?.approxLocation || 'Madhapur');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Account & Location Preferences
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Manage your contact details and default search locality for nearby tailor discovery.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                  {user?.profile?.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <CardTitle className="text-base">
                    {user?.profile?.firstName} {user?.profile?.lastName}
                  </CardTitle>
                  <p className="text-xs text-stone-500">{user?.email || user?.phone}</p>
                </div>
              </div>
              <Badge variant="gold" className="capitalize">
                {user?.role.toLowerCase()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={user?.profile?.firstName || ''} disabled />
                <Input label="Last Name" value={user?.profile?.lastName || ''} disabled />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Hyderabad"
                />
                <Input
                  label="Locality / Neighborhood"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Madhapur"
                />
              </div>

              {saved && (
                <p className="p-2 rounded bg-emerald-50 text-emerald-800 font-medium">
                  Preferences updated successfully!
                </p>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="outline" size="sm" onClick={logout}>
                  <LogOut className="w-3.5 h-3.5 mr-1 text-red-600" />
                  Sign Out
                </Button>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-800" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer">
              <div>
                <p className="font-semibold text-stone-900">In-App Timeline Notifications</p>
                <p className="text-stone-500">Real-time alerts when cutting, stitching or trial status advances</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-slate-900" />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200 cursor-pointer">
              <div>
                <p className="font-semibold text-stone-900">Push Notifications</p>
                <p className="text-stone-500">Receive mobile PWA push notifications for quote arrivals</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-slate-900" />
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
