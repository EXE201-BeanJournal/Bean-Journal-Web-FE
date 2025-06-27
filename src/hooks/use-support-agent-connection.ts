'use client'

import { useSupportSupabase } from '@/contexts/SupportSupabaseContext';
import { useUser } from '@clerk/clerk-react';
import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SupportAgent {
  id: string;
  name: string;
  image?: string;
  isOnline: boolean;
}

export interface SupportMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  agentId?: string;
}

export interface SupportSession {
  id: string;
  userId: string;
  agentId?: string;
  agentName?: string;
  agentImage?: string;
  status: 'waiting' | 'connected' | 'ended';
  messages: SupportMessage[];
  createdAt: Date;
}

export const useSupportAgentConnection = () => {
  const supabase = useSupportSupabase();
  const { user } = useUser();
  const [currentSession, setCurrentSession] = useState<SupportSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [availableAgents, setAvailableAgents] = useState<SupportAgent[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Initialize Supabase connection
  useEffect(() => {
    if (!user || !supabase) return;

    try {
      const supabaseClient = supabase;
      
      // Create support channel for real-time communication
      const supportChannel = supabaseClient.channel('support-requests', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Listen for agent responses
      supportChannel
        .on('broadcast', { event: 'agent-connected' }, async (payload) => {
          console.log('Agent connected:', payload);
          const { sessionId, agentId, agentName, agentImage } = payload.payload;
          if (sessionId === currentSessionId) {
            try {
              // Update session status in database
              const { error } = await supabase
                .from('support_sessions')
                .update({
                  agent_id: agentId,
                  agent_name: agentName,
                  status: 'connected',
                  updated_at: new Date().toISOString()
                })
                .eq('id', sessionId);

              if (error) {
                console.error('Error updating session on agent connect:', error);
              }
            } catch (error) {
              console.error('Error handling agent connected:', error);
            }

            setCurrentSession(prev => prev ? {
              ...prev,
              agentId,
              agentName,
              agentImage,
              status: 'connected'
            } : null);
          }
        })
        .on('broadcast', { event: 'support-message' }, async (payload) => {
          console.log('Support message received:', payload);
          const { sessionId, message } = payload.payload;
          if (sessionId === currentSessionId) {
            // Ensure timestamp is a proper Date object
            const processedMessage: SupportMessage = {
              ...message,
              timestamp: new Date(message.timestamp)
            };
            
            // Note: Agent messages are already saved to database by the admin dashboard
            // We just need to update local state here
            setMessages(prev => [...prev, processedMessage]);
          }
        })
        .on('broadcast', { event: 'session-ended' }, async (payload) => {
          console.log('Session ended:', payload);
          const { sessionId } = payload.payload;
          if (sessionId === currentSessionId) {
            try {
              // Update session status in database
              const { error } = await supabase
                .from('support_sessions')
                .update({
                  status: 'ended',
                  ended_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', sessionId);

              if (error) {
                console.error('Error updating session on end:', error);
              }
            } catch (error) {
              console.error('Error handling session ended:', error);
            }

            // Add end message to show user the session has ended
            const endMessage: SupportMessage = {
              id: `msg_end_${Date.now()}`,
              content: 'This session has ended. You can start a new session or close this window.',
              sender: 'system',
              timestamp: new Date()
            };
            
            setMessages(prev => [...prev, endMessage]);
            
            // Update current session status to ended
            setCurrentSession(prev => prev ? {
              ...prev,
              status: 'ended'
            } : null);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence synced');
          const presenceState = supportChannel.presenceState();
          const agents: SupportAgent[] = [];
          
          Object.values(presenceState).forEach((presence: unknown[]) => {
            presence.forEach((value: unknown) => {
              const agent = value as { id: string; name: string; image?: string; isOnline: boolean };
              if (agent.isOnline) {
                agents.push({
                  id: agent.id,
                  name: agent.name,
                  image: agent.image,
                  isOnline: true
                });
              }
            });
          });
          
          setAvailableAgents(agents);
        })
        .subscribe();

      setChannel(supportChannel);

      return () => {
        supportChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize Supabase connection:', error);
    }
  }, [user, currentSessionId]);

  // Request support from available agents
  const requestSupport = useCallback(async (initialMessage?: string) => {
    if (!channel || !user || currentSession) return null;

    setIsConnecting(true);
    const sessionId = `session_${Date.now()}_${user.id}`;
    setCurrentSessionId(sessionId);

    const newSession: SupportSession = {
      id: sessionId,
      userId: user.id,
      status: 'waiting',
      messages: [],
      createdAt: new Date()
    };

    try {
      // Save session to database
      const { error: sessionError } = await supabase!
        .from('support_sessions')
        .insert({
          id: sessionId,
          user_id: user.id,
          user_name: user.fullName || 'Anonymous User',
          user_image: user.imageUrl || null,
          status: 'waiting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (sessionError) {
        console.error('Error creating support session:', sessionError);
        setIsConnecting(false);
        return null;
      }

      setCurrentSession(newSession);

      // Add initial message if provided
      if (initialMessage) {
        const message: SupportMessage = {
          id: `msg_${Date.now()}`,
          content: initialMessage,
          sender: 'user',
          timestamp: new Date()
        };
        
        // Save initial message to database
        const { error: messageError } = await supabase!
          .from('support_messages')
          .insert({
            id: message.id,
            session_id: sessionId,
            content: message.content,
            sender: 'user',
            user_id: user.id,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (messageError) {
          console.error('Error saving initial message:', messageError);
        }
        
        setMessages([message]);
      }

      // Broadcast support request to agents
      await channel.send({
        type: 'broadcast',
        event: 'support-request',
        payload: {
          sessionId,
          userId: user.id,
          userName: user.fullName || 'Anonymous User',
          userImage: user.imageUrl,
          initialMessage
        }
      });

      setIsConnecting(false);
      return sessionId;
    } catch (error) {
      console.error('Error requesting support:', error);
      setIsConnecting(false);
      return null;
    }
  }, [channel, user, currentSession, supabase]);

  // Send message to agent
  const sendMessage = useCallback(async (content: string) => {
    if (!channel || !currentSession || !user) return;

    const message: SupportMessage = {
      id: `msg_${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date()
    };

    try {
      // Save message to database
      const { error } = await supabase!
        .from('support_messages')
        .insert({
          id: message.id,
          session_id: currentSession.id,
          content: message.content,
          sender: 'user',
          user_id: user.id,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving message:', error);
        return;
      }

      setMessages(prev => [...prev, message]);

      await channel.send({
        type: 'broadcast',
        event: 'user-message',
        payload: {
          sessionId: currentSession.id,
          message
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [channel, currentSession, user, supabase]);

  // End support session
  const endSession = useCallback(async () => {
    if (!currentSessionId || !supabase) return;

    try {
      // Broadcast session end to admin dashboard
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'session-ended',
          payload: { sessionId: currentSessionId }
        });
      }

      // Update session status in database
      const { error } = await supabase
        .from('support_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

      if (error) {
        console.error('Error ending session:', error);
        return;
      }

      // Update session status to ended instead of clearing immediately
      setCurrentSession(prev => prev ? {
        ...prev,
        status: 'ended'
      } : null);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [currentSessionId, supabase, channel]);

  const clearSession = useCallback(() => {
    // Clear local state completely
    setCurrentSession(null);
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  return {
    currentSession,
    messages,
    availableAgents,
    isConnecting,
    requestSupport,
    sendMessage,
    endSession,
    clearSession
  };
};