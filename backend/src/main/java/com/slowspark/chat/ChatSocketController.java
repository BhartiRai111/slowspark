package com.slowspark.chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket side of chat. The app sends to "/app/chat.send" with {"matchId": 1, "content": "Hi"}.
 * The Principal's name is the user id, set by StompAuthInterceptor on CONNECT.
 */
@Controller
public class ChatSocketController {

    public record SocketMessage(Long matchId, String content) {}

    private final ChatService chatService;

    public ChatSocketController(ChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/chat.send")
    public void send(@Payload SocketMessage msg, Principal principal) {
        chatService.send(msg.matchId(), Long.valueOf(principal.getName()), msg.content());
    }
}
