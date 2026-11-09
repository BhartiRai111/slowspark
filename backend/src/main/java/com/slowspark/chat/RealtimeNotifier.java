package com.slowspark.chat;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Pushes live events to a user's phone over WebSocket.
 * The app subscribes to "/user/queue/events" after connecting, and receives
 * {"type": "...", "data": {...}} — e.g. NEW_MESSAGE, NEW_MATCH, DATE_UPDATE.
 */
@Component
public class RealtimeNotifier {

    private final SimpMessagingTemplate template;

    public RealtimeNotifier(SimpMessagingTemplate template) {
        this.template = template;
    }

    public void send(Long userId, String type, Object data) {
        template.convertAndSendToUser(String.valueOf(userId), "/queue/events", Map.of("type", type, "data", data));
    }
}
