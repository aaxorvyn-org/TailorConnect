import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '@tailorconnect/api-client';

export function ClerkSyncBridge() {
  const { isSignedIn, user: clerkUser } = useUser();
  const { user: appUser, setUserFromSession } = useAuth();

  useEffect(() => {
    async function sync() {
      if (isSignedIn && clerkUser && !appUser) {
        try {
          const email = clerkUser.primaryEmailAddress?.emailAddress;
          if (!email) return;

          const res = await fetch('/api/v1/auth/clerk-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: clerkUser.id,
              email,
              firstName: clerkUser.firstName || email.split('@')[0],
              lastName: clerkUser.lastName || '',
              phone: clerkUser.primaryPhoneNumber?.phoneNumber,
            }),
          });

          const data = await res.json();
          if (data.success && data.data) {
            api.setToken(data.data.accessToken);
            if (setUserFromSession) {
              setUserFromSession(data.data.user);
            }
          }
        } catch (e) {
          console.error('Clerk synchronization error:', e);
        }
      }
    }
    sync();
  }, [isSignedIn, clerkUser, appUser, setUserFromSession]);

  return null;
}
