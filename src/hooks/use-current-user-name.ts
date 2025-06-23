import { useUser } from '@clerk/clerk-react';

export const useCurrentUserName = () => {
  const { user } = useUser();

  return user?.fullName || '?';
};
