import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Users, User, Clock, Check, CheckCheck } from 'lucide-react';
import type { Conversation, UserPresence } from '../../lib/messages';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  currentUserId: string;
  presenceState: Record<string, UserPresence>;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
  presenceState
}) => {
  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.title;
    }
    
    const otherParticipant = conversation.participants?.find(
      p => p.profile_id !== currentUserId
    );
    return otherParticipant?.profile?.full_name || 'Unknown User';
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) return 'No messages yet';
    
    if (conversation.last_message.content === '[Message deleted]') {
      return 'Message deleted';
    }
    
    if (conversation.last_message.attachments?.length) {
      return `📎 ${conversation.last_message.attachments.length} attachment${
        conversation.last_message.attachments.length === 1 ? '' : 's'
      }`;
    }
    
    return conversation.last_message.content || 'Empty message';
  };

  const getMessageStatus = (conversation: Conversation) => {
    const lastMessage = conversation.last_message;
    if (!lastMessage || lastMessage.sender_id !== currentUserId) return null;

    const statuses = lastMessage.status || [];
    const allRead = statuses.every(s => s.status === 'read');
    const allDelivered = statuses.every(s => s.status === 'delivered');

    if (allRead) return 'read';
    if (allDelivered) return 'delivered';
    return 'sent';
  };

  const getPresenceStatus = (conversation: Conversation) => {
    if (conversation.type === 'group') return null;

    const otherParticipant = conversation.participants?.find(
      p => p.profile_id !== currentUserId
    );
    if (!otherParticipant) return null;

    return presenceState[otherParticipant.profile_id]?.status || 'offline';
  };

  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = parseISO(timestamp);
    if (!isValid(date)) return '';
    return format(date, 'HH:mm');
  };

  // Filter out invalid conversations
  const validConversations = conversations.filter(conversation => {
    // Must have at least one other participant
    const hasValidParticipant = conversation.participants?.some(p => 
      p.profile_id !== currentUserId && p.profile?.full_name
    );
    
    // Group chats must have a title
    if (conversation.type === 'group' && !conversation.title) {
      return false;
    }

    return hasValidParticipant;
  });

  return (
    <div className="h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="divide-y divide-gray-200">
        {validConversations.map((conversation) => {
          const presenceStatus = getPresenceStatus(conversation);
          const messageStatus = getMessageStatus(conversation);
          const otherParticipant = conversation.participants?.find(
            p => p.profile_id !== currentUserId
          );

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                selectedId === conversation.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {otherParticipant?.profile?.avatar_url ? (
                    <img 
                      src={otherParticipant.profile.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : conversation.type === 'group' ? (
                    <Users className="h-6 w-6 text-gray-500" />
                  ) : (
                    <User className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                {presenceStatus && (
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    presenceStatus === 'online' ? 'bg-green-500' :
                    presenceStatus === 'away' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {getConversationTitle(conversation)}
                  </h3>
                  {conversation.last_message && (
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.last_message?.sender_id === currentUserId && (
                      <span className="mr-1">You:</span>
                    )}
                    {getLastMessagePreview(conversation)}
                  </p>
                  {messageStatus && (
                    <span className="ml-2 text-gray-400">
                      {messageStatus === 'read' ? (
                        <CheckCheck className="h-4 w-4 text-blue-500" />
                      ) : messageStatus === 'delivered' ? (
                        <CheckCheck className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </div>
                
                {conversation.type === 'group' && (
                  <p className="text-xs text-gray-400 mt-1">
                    {conversation.participants?.length || 0} members
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {validConversations.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
};