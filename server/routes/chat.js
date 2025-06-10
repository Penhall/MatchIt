// server/routes/chat.js - Chat message routes
import express from 'express';
import { validateRequired } from '../middleware/validation.js';
import { ChatService } from '../services/chatService.js';

const router = express.Router();
const chatService = new ChatService();

// GET /:matchId/messages - Get match messages
router.get('/:matchId/messages', async (req, res) => {
  try {
    const { matchId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const hasAccess = await chatService.userHasAccessToMatch(matchId, req.user.userId);
    if (!hasAccess) {
      return res.status(404).json({ 
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
    }
    
    const messages = await chatService.getMatchMessages(matchId, {
      page: parseInt(page),
      limit: parseInt(limit),
      userId: req.user.userId
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'MESSAGE_FETCH_ERROR'
    });
  }
});

// POST /:matchId/messages - Send message
router.post('/:matchId/messages', validateRequired(['message']), async (req, res) => {
  try {
    const { matchId } = req.params;
    const { message, messageType = 'text' } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Message cannot be empty',
        code: 'EMPTY_MESSAGE'
      });
    }
    
    const hasAccess = await chatService.userHasAccessToMatch(matchId, req.user.userId);
    if (!hasAccess) {
      return res.status(404).json({ 
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      });
    }
    
    const sentMessage = await chatService.sendMessage({
      matchId,
      senderId: req.user.userId,
      message: message.trim(),
      messageType
    });
    
    res.status(201).json(sentMessage);
    
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ 
        error: 'Not authorized for this match',
        code: 'UNAUTHORIZED_MATCH'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'MESSAGE_SEND_ERROR'
    });
  }
});

export default router;
