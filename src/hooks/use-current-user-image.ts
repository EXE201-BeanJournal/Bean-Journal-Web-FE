import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (user?.imageUrl) {
      setImage(user.imageUrl);
    }
  }, [user]);

  return image;
};
