import { ref, onUnmounted } from 'vue';
import type { WSChannel, WSMessage } from '@/types';

interface UseWebSocketOptions {
  url: string;
  apiKey?: string;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    apiKey = '',
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
  } = options;

  const isConnected = ref(false);
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let currentReconnectInterval = reconnectInterval;
  let messageHandler: ((msg: WSMessage) => void) | null = null;
  let subscribedChannels: WSChannel[] = [];

  function connect(): void {
    const wsUrl = apiKey ? `${url}?api_key=${apiKey}` : url;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      isConnected.value = true;
      currentReconnectInterval = reconnectInterval;
      if (subscribedChannels.length > 0) {
        sendCommand('subscribe', subscribedChannels);
      }
    };

    ws.onclose = () => {
      isConnected.value = false;
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will fire after this
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        messageHandler?.(msg);
      } catch {
        // Ignore malformed messages
      }
    };
  }

  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    ws?.close();
    ws = null;
    isConnected.value = false;
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, currentReconnectInterval);
    currentReconnectInterval = Math.min(currentReconnectInterval * 2, maxReconnectInterval);
  }

  function sendCommand(action: 'subscribe' | 'unsubscribe', channels: WSChannel[]): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action, channels }));
    }
  }

  function subscribe(channels: WSChannel[]): void {
    subscribedChannels = [...new Set([...subscribedChannels, ...channels])];
    sendCommand('subscribe', channels);
  }

  function unsubscribe(channels: WSChannel[]): void {
    subscribedChannels = subscribedChannels.filter((c) => !channels.includes(c));
    sendCommand('unsubscribe', channels);
  }

  function onMessage(handler: (msg: WSMessage) => void): void {
    messageHandler = handler;
  }

  onUnmounted(() => {
    disconnect();
  });

  return { isConnected, connect, disconnect, subscribe, unsubscribe, onMessage };
}
