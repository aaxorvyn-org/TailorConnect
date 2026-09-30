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

          const res = await api.auth.clerkSync({
            clerkId: clerkUser.id,
            email,
            firstName: clerkUser.firstName || email.split('@')[0],
            lastName: clerkUser.lastName || '',
            phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          });

          if (res.success && res.data) {
            api.setToken(res.data.accessToken);
            if (setUserFromSession) {
              setUserFromSession(res.data.user);
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
