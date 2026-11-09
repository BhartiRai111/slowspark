package com.slowspark.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Checks the JWT when the app opens the WebSocket (STOMP CONNECT frame).
 * On success the connection's user name becomes the user id, so
 * convertAndSendToUser("12", ...) reaches user 12's phone.
 * It also stops anyone subscribing to another user's private queue.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public StompAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String header = accessor.getFirstNativeHeader("Authorization");
            Long userId = header != null && header.startsWith("Bearer ")
                    ? jwtService.parseUserId(header.substring(7)).orElse(null)
                    : null;
            if (userId == null) {
                throw new MessagingException("Unauthorized");
            }
            accessor.setUser(new UsernamePasswordAuthenticationToken(String.valueOf(userId), null, List.of()));
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String dest = accessor.getDestination();
            // Only personal queues are allowed (/user/queue/...). Spring routes them to the right user.
            if (accessor.getUser() == null || dest == null || !dest.startsWith("/user/queue/")) {
                throw new MessagingException("Subscription not allowed");
            }
        } else if (StompCommand.SEND.equals(accessor.getCommand()) && accessor.getUser() == null) {
            throw new MessagingException("Unauthorized");
        }
        return message;
    }
}
