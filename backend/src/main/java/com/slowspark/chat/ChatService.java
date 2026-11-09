package com.slowspark.chat;

import com.slowspark.common.ApiException;
import com.slowspark.match.Match;
import com.slowspark.match.MatchService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Sending and reading chat messages. Both REST and WebSocket go through here. */
@Service
public class ChatService {

    public record MessageDto(Long id, Long matchId, Long senderId, String content, Instant sentAt, Instant readAt) {
        static MessageDto of(Message m) {
            return new MessageDto(m.getId(), m.getMatchId(), m.getSenderId(), m.getContent(), m.getSentAt(), m.getReadAt());
        }
    }

    private static final int MAX_PAGE = 50;

    private final MessageRepository messages;
    private final MatchService matchService;
    private final RealtimeNotifier notifier;

    public ChatService(MessageRepository messages, MatchService matchService, RealtimeNotifier notifier) {
        this.messages = messages;
        this.matchService = matchService;
        this.notifier = notifier;
    }

    @Transactional
    public MessageDto send(Long matchId, Long me, String content) {
        if (content == null || content.isBlank()) {
            throw ApiException.badRequest("Khaali message nahi bhej sakte");
        }
        if (content.length() > 2000) {
            throw ApiException.badRequest("Message bahut lamba hai");
        }
        Match match = matchService.requireActiveMatch(matchId, me);
        MessageDto dto = MessageDto.of(messages.save(new Message(matchId, me, content.trim())));
        notifier.send(match.otherUser(me), "NEW_MESSAGE", dto);
        notifier.send(me, "NEW_MESSAGE", dto); // keeps the sender's other devices in sync
        return dto;
    }

    /** Newest first. Pass beforeId to load older messages. */
    @Transactional(readOnly = true)
    public List<MessageDto> history(Long matchId, Long me, Long beforeId, int size) {
        matchService.requireActiveMatch(matchId, me);
        PageRequest page = PageRequest.of(0, Math.min(Math.max(size, 1), MAX_PAGE));
        List<Message> list = beforeId == null
                ? messages.findByMatchIdOrderByIdDesc(matchId, page)
                : messages.findByMatchIdAndIdLessThanOrderByIdDesc(matchId, beforeId, page);
        return list.stream().map(MessageDto::of).toList();
    }

    @Transactional
    public void markRead(Long matchId, Long me) {
        Match match = matchService.requireActiveMatch(matchId, me);
        if (messages.markRead(matchId, me, Instant.now()) > 0) {
            notifier.send(match.otherUser(me), "MESSAGES_READ", Map.of("matchId", matchId));
        }
    }
}
