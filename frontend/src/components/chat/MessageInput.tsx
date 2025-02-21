import React, { useState, useRef } from 'react';
import { Paperclip, Send, X, Image, FileText, Film, Music } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_FILE_TYPES = {
  'image/*': {
    icon: Image,
    label: 'Image'
  },
  'application/pdf': {
    icon: FileText,
    label: 'PDF'
  },
  'video/*': {
    icon: Film,
    label: 'Video'
  },
  'audio/*': {
    icon: Music,
    label: 'Audio'
  }
};

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() || attachments.length > 0) {
      onSend(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is 25MB.`);
        return false;
      }

      // Check file type
      const isValidType = Object.keys(ALLOWED_FILE_TYPES).some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isValidType) {
        alert(`File type ${file.type} is not supported.`);
        return false;
      }

      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    setShowAttachmentMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileTypeIcon = (file: File) => {
    const matchingType = Object.entries(ALLOWED_FILE_TYPES).find(([type]) => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    return matchingType ? matchingType[1].icon : FileText;
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, index) => {
            const FileIcon = getFileTypeIcon(file);
            return (
              <div
                key={index}
                className="flex items-center bg-gray-100 rounded-full px-3 py-1"
              >
                <FileIcon className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-700 truncate max-w-[200px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          {showAttachmentMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              {Object.entries(ALLOWED_FILE_TYPES).map(([type, { icon: Icon, label }]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachmentMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50"
                >
                  <Icon className="h-5 w-5 mr-3 text-gray-500" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={1}
            disabled={disabled}
          />
        </div>
        
        <button
          type="submit"
          className={`p-2 rounded-full ${
            message.trim() || attachments.length > 0
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-100 text-gray-400'
          }`}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
        >
          <Send className="h-5 w-5" />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
          disabled={disabled}
        />
      </div>
    </form>
  );
};