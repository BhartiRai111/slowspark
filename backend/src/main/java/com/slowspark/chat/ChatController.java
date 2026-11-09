package com.slowspark.chat;

import com.slowspark.chat.ChatService.MessageDto;
import com.slowspark.security.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST side of chat. The app can send via REST or WebSocket; new messages always
 * arrive live over WebSocket (see ChatSocketController / RealtimeNotifier).
 */
@RestController
@RequestMapping("/api/matches/{matchId}/messages")
public class ChatController {

    public record SendRequest(@NotBlank @Size(max = 2000) String content) {}

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<MessageDto> history(@PathVariable Long matchId,
                                    @RequestParam(required = false) Long beforeId,
                                    @RequestParam(defaultValue = "30") int size) {
        return chatService.history(matchId, CurrentUser.id(), beforeId, size);
    }

    @PostMapping
    public MessageDto send(@PathVariable Long matchId, @Valid @RequestBody SendRequest req) {
        return chatService.send(matchId, CurrentUser.id(), req.content());
    }

    @PostMapping("/read")
    public ResponseEntity<Void> read(@PathVariable Long matchId) {
        chatService.markRead(matchId, CurrentUser.id());
        return ResponseEntity.noContent().build();
    }
}
