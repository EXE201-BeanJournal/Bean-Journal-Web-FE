import { AvatarStack } from '@/components/avatar-stack'
import { useRealtimePresenceRoom } from '@/hooks/use-realtime-presence-room'
import { useMemo } from 'react'

export const RealtimeAvatarStack = ({ roomName }: { roomName: string }) => {
  const { users: usersMap } = useRealtimePresenceRoom(roomName)
  const avatars = useMemo(() => {
    return Object.values(usersMap)
      .filter((user) => !!user.image)
      .map((user) => ({
        name: user.name,
        image: user.image as string,
      }))
  }, [usersMap])

  return <AvatarStack avatars={avatars} />
}
