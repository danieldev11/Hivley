import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, File, Paperclip, Clock, Image } from 'lucide-react';
import type { Message } from '../../lib/messages';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }, [messages.length, isLoadingMore]);

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Show/hide scroll to bottom button
    setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 100);
    
    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      const oldScrollHeight = scrollHeight;
      await onLoadMore();
      // Maintain scroll position after loading more messages
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight - oldScrollHeight;
      }
    }
  };

  const getMessageStatus = (message: Message) => {
    if (!message.status?.length) return 'sending';
    
    const allRead = message.status.every(s => s.status === 'read');
    const allDelivered = message.status.every(s => s.status === 'delivered');
    
    if (allRead) return 'read';
    if (allDelivered) return 'delivered';
    return 'sent';
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCheck className="h-4 w-4 text-gray-500" />;
      case 'sent':
        return <Check className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderAttachment = (attachment: Message['attachments'][0]) => {
    const isImage = attachment.file_type.startsWith('image/');
    const isVideo = attachment.file_type.startsWith('video/');
    const isAudio = attachment.file_type.startsWith('audio/');
    
    if (isImage) {
      return (
        <div className="mt-2 relative group">
          <img
            src={attachment.file_path}
            alt={attachment.file_name}
            className="max-w-sm rounded-lg"
          />
          <a
            href={attachment.file_path}
            download={attachment.file_name}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image className="h-6 w-6 text-white" />
          </a>
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          src={attachment.file_path}
          controls
          className="mt-2 max-w-sm rounded-lg"
        />
      );
    }

    if (isAudio) {
      return (
        <audio
          src={attachment.file_path}
          controls
          className="mt-2 max-w-sm"
        />
      );
    }

    return (
      <a
        href={attachment.file_path}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <File className="h-5 w-5 text-gray-400 mr-2" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.file_name}
          </p>
          <p className="text-xs text-gray-500">
            {Math.round(attachment.file_size / 1024)}KB
          </p>
        </div>
        <Paperclip className="h-4 w-4 text-gray-400 ml-2" />
      </a>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={handleScroll}
    >
      {isLoadingMore && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary"></div>
        </div>
      )}
      
      {messages.map((message, index) => {
        const isCurrentUser = message.sender_id === currentUserId;
        const showAvatar = !isCurrentUser && (!messages[index - 1] || messages[index - 1].sender_id !== message.sender_id);
        const status = getMessageStatus(message);

        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {showAvatar && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {message.sender?.full_name?.[0]}
                  </span>
                </div>
              )}
              
              <div>
                {showAvatar && (
                  <p className="text-sm text-gray-600 mb-1">
                    {message.sender?.full_name}
                  </p>
                )}
                
                <div className={`
                  rounded-lg px-4 py-2 max-w-full break-words
                  ${message.deleted_at
                    ? 'bg-gray-100 text-gray-500 italic'
                    : isCurrentUser
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-900'
                  }
                `}>
                  {message.deleted_at ? (
                    <p className="text-sm">Message deleted</p>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.attachments?.map(renderAttachment)}
                      {message.edited_at && (
                        <p className="text-xs mt-1 opacity-70">(edited)</p>
                      )}
                    </>
                  )}
                  
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className="text-xs opacity-70">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </span>
                    {isCurrentUser && renderStatusIcon(status)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />

      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-4 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
};