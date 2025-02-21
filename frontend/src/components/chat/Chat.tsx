import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  User,
  Search,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConversationList } from './ConversationList';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  subscribeToConversation,
  updatePresence,
  type Conversation,
  type Message,
  type UserPresence
} from '../../lib/messages';
import { getCurrentUser } from '../../lib/auth';

export const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [presenceState, setPresenceState] = useState<Record<string, UserPresence>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadCurrentUser();
    loadConversations();

    // Set initial presence
    updatePresence('online');

    // Update presence every 5 minutes
    const presenceInterval = setInterval(() => {
      updatePresence('online');
    }, 5 * 60 * 1000);

    // Set offline presence when leaving
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, []);

  useEffect(() => {
    // Handle conversation selection from navigation state
    const state = location.state as { conversationId?: string } | null;
    if (state?.conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === state.conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        // Clear the navigation state
        window.history.replaceState({}, document.title);
      }
    }
  }, [conversations, location.state]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const subscription = subscribeToConversation(
        selectedConversation.id,
        (message) => {
          setMessages(prev => [message, ...prev]);
        },
        (presence) => {
          setPresenceState(prev => ({
            ...prev,
            [presence.profile_id]: presence
          }));
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConversation]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await getConversations();
      setConversations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string, before?: string) => {
    try {
      setIsLoadingMore(true);
      const data = await getConversationMessages(conversationId, 20, before);
      if (before) {
        setMessages(prev => [...prev, ...data]);
      } else {
        setMessages(data);
      }
      setHasMore(data.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    if (!selectedConversation || !messages.length || isLoadingMore) return;
    const oldestMessage = messages[messages.length - 1];
    await loadMessages(selectedConversation.id, oldestMessage.created_at);
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      const clientGeneratedId = `${Date.now()}-${Math.random()}`;
      await sendMessage({
        conversation_id: selectedConversation.id,
        content: content.trim(),
        client_generated_id: clientGeneratedId,
        attachments
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const searchTerm = searchQuery.toLowerCase();
    const title = conversation.title?.toLowerCase() || '';
    const participants = conversation.participants?.map(p => p.profile?.full_name.toLowerCase()) || [];
    
    return title.includes(searchTerm) || participants.some(name => name?.includes(searchTerm));
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadConversations}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants?.find(p => p.profile_id !== currentUser?.id);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {showSidebar ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`
          w-full max-w-sm bg-white border-r border-gray-200
          fixed lg:relative inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversation List */}
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedConversation?.id}
          onSelect={setSelectedConversation}
          currentUserId={currentUser?.id}
          presenceState={presenceState}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {selectedConversation.type === 'group' ? (
                    <Users className="h-6 w-6 text-gray-500" />
                  ) : (
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {getOtherParticipant(selectedConversation)?.profile?.avatar_url ? (
                        <img 
                          src={getOtherParticipant(selectedConversation)?.profile?.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.type === 'group' 
                      ? selectedConversation.title 
                      : getOtherParticipant(selectedConversation)?.profile?.full_name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.type === 'group' 
                      ? `${selectedConversation.participants?.length || 0} members`
                      : presenceState[getOtherParticipant(selectedConversation)?.profile_id || '']?.status || 'offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={currentUser?.id}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
            />

            {/* Message Input */}
            <MessageInput
              onSend={handleSendMessage}
              disabled={!selectedConversation}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
              <p className="mt-1 text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};