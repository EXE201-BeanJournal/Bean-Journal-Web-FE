'use client'

import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { useSupabase } from '@/contexts/SupabaseContext';
import { useEffect, useState } from 'react';

export type RealtimeUser = {
  id: string
  name: string
  image: string | null
}

type Presence = {
    name: string;
    image: string | null;
}

export const useRealtimePresenceRoom = (roomName: string) => {
  const currentUserImage = useCurrentUserImage()
  const currentUserName = useCurrentUserName();
  const supabase = useSupabase();

  const [users, setUsers] = useState<Record<string, RealtimeUser>>({})

  useEffect(() => {
    if (!supabase || !currentUserName) return;
    const room = supabase.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState<Presence>()

        const newUsers = Object.fromEntries(
          Object.entries(newState).map(([key, presences]) => [
            key,
            { id: key, name: presences[0].name, image: presences[0].image },
          ])
        ) as Record<string, RealtimeUser>
        setUsers(newUsers)
      })
      .subscribe(async (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
        if (status !== 'SUBSCRIBED') {
          return
        }

        await room.track({
          name: currentUserName,
          image: currentUserImage,
        })
      })

    return () => {
      room.unsubscribe()
    }
  }, [supabase, roomName, currentUserName, currentUserImage])

  return { users }
}
