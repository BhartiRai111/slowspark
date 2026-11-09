import { Client } from '@stomp/stompjs';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { getToken } from '../api/client';
import { socketUrl } from '../config';
import { useAuth } from '../auth/AuthContext';

/**
 * One WebSocket (STOMP) connection for the whole app while logged in.
 * The backend pushes events to /user/queue/events:
 *   NEW_MESSAGE, MESSAGES_READ, NEW_MATCH, UNMATCHED, DATE_UPDATE
 * Screens call useRealtime(handler) to react to them.
 */
export interface RealtimeEvent {
  type: 'NEW_MESSAGE' | 'MESSAGES_READ' | 'NEW_MATCH' | 'UNMATCHED' | 'DATE_UPDATE';
  data: any;
}

type Listener = (event: RealtimeEvent) => void;

const RealtimeContext = createContext<{ listeners: Set<Listener> } | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const listeners = useRef(new Set<Listener>()).current;

  useEffect(() => {
    if (status !== 'ready') return;
    const client = new Client({
      brokerURL: socketUrl,
      connectHeaders: { Authorization: `Bearer ${getToken()}` },
      reconnectDelay: 5000,
      // Needed for React Native's WebSocket implementation:
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        client.subscribe('/user/queue/events', (frame) => {
          try {
            const event = JSON.parse(frame.body) as RealtimeEvent;
            listeners.forEach((l) => l(event));
          } catch {
            // ignore malformed events
          }
        });
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [status, listeners]);

  const value = useMemo(() => ({ listeners }), [listeners]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

/** Calls handler for every live event while the component is mounted. */
export function useRealtime(handler: Listener) {
  const ctx = useContext(RealtimeContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    if (!ctx) return;
    const l: Listener = (e) => handlerRef.current(e);
    ctx.listeners.add(l);
    return () => {
      ctx.listeners.delete(l);
    };
  }, [ctx]);
}
