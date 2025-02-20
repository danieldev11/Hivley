import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  reply_to_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  is_system_message: boolean;
  metadata: Record<string, any>;
  client_generated_id?: string;
  attachments?: MessageAttachment[];
  status?: MessageStatus[];
  reactions?: MessageReaction[];
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  thumbnail_path?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface MessageStatus {
  id: string;
  message_id: string;
  profile_id: string;
  status: 'sent' | 'delivered' | 'read';
  updated_at: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  profile_id: string;
  emoji: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  created_by: string;
  metadata: Record<string, any>;
  participants?: ConversationParticipant[];
  last_message?: Message;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  profile_id: string;
  joined_at: string;
  last_read_at: string;
  is_admin: boolean;
  notifications_enabled: boolean;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface UserPresence {
  profile_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen_at: string;
  metadata: Record<string, any>;
}

export async function getConversations() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        *,
        profile:profiles(full_name, avatar_url)
      ),
      last_message:messages(
        *,
        sender:profiles(full_name, avatar_url),
        attachments:message_attachments(*),
        status:message_status(*),
        reactions:message_reactions(*)
      )
    `)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return conversations;
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  before?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(full_name, avatar_url),
      attachments:message_attachments(*),
      status:message_status(*),
      reactions:message_reactions(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: messages, error } = await query;

  if (error) throw error;
  return messages;
}

export async function sendMessage(data: {
  conversation_id: string;
  content: string;
  reply_to_id?: string;
  client_generated_id: string;
  attachments?: File[];
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Start a transaction
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: data.conversation_id,
      sender_id: user.id,
      content: data.content,
      reply_to_id: data.reply_to_id,
      client_generated_id: data.client_generated_id,
      is_system_message: false
    })
    .select()
    .single();

  if (messageError) throw messageError;

  // Upload attachments if any
  if (data.attachments?.length) {
    const attachmentPromises = data.attachments.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${message.id}/${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/messages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      return supabase
        .from('message_attachments')
        .insert({
          message_id: message.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: publicUrl
        });
    });

    await Promise.all(attachmentPromises);
  }

  return message;
}

export async function updateMessageStatus(
  messageId: string,
  status: 'delivered' | 'read'
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('message_status')
    .upsert({
      message_id: messageId,
      profile_id: user.id,
      status
    }, {
      onConflict: 'message_id,profile_id'
    });

  if (error) throw error;
}

export async function createConversation(data: {
  type: 'direct' | 'group';
  title?: string;
  participant_ids: string[];
  metadata?: Record<string, any>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // For direct conversations, check if one already exists with the same participant
  if (data.type === 'direct' && data.participant_ids.length === 1) {
    const { data: existingConversations, error: searchError } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(profile_id)
      `)
      .eq('type', 'direct')
      .or(`created_by.eq.${user.id},created_by.eq.${data.participant_ids[0]}`);

    if (searchError) throw searchError;

    // Find a conversation where both users are participants
    const existingConversation = existingConversations?.find(conv => {
      const participantIds = conv.participants?.map(p => p.profile_id) || [];
      return participantIds.includes(user.id) && participantIds.includes(data.participant_ids[0]);
    });

    if (existingConversation) {
      return existingConversation;
    }
  }

  // Create conversation
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .insert({
      type: data.type,
      title: data.title,
      created_by: user.id,
      metadata: data.metadata || {}
    })
    .select()
    .single();

  if (conversationError) throw conversationError;

  // Add participants
  const participants = [
    user.id,
    ...data.participant_ids.filter(id => id !== user.id)
  ];

  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert(
      participants.map(profileId => ({
        conversation_id: conversation.id,
        profile_id: profileId,
        is_admin: profileId === user.id
      }))
    );

  if (participantsError) throw participantsError;

  return conversation;
}

export async function updatePresence(status: 'online' | 'offline' | 'away') {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('user_presence')
    .upsert({
      profile_id: user.id,
      status,
      last_seen_at: new Date().toISOString()
    }, {
      onConflict: 'profile_id'
    });

  if (error) throw error;
}

export async function addReaction(messageId: string, emoji: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('message_reactions')
    .insert({
      message_id: messageId,
      profile_id: user.id,
      emoji
    });

  if (error) throw error;
}

export async function removeReaction(messageId: string, emoji: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .match({
      message_id: messageId,
      profile_id: user.id,
      emoji
    });

  if (error) throw error;
}

export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: Message) => void,
  onPresence?: (presence: UserPresence) => void
) {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    );

  if (onPresence) {
    channel.on(
      'presence',
      { event: 'sync' },
      () => {
        const state = channel.presenceState();
        Object.values(state).forEach(presence => {
          onPresence(presence as UserPresence);
        });
      }
    );
  }

  return channel.subscribe();
}

export async function editMessage(
  messageId: string,
  content: string
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('messages')
    .update({
      content,
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .eq('sender_id', user.id);

  if (error) throw error;
}

export async function deleteMessage(messageId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('messages')
    .update({
      content: '[Message deleted]',
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .eq('sender_id', user.id);

  if (error) throw error;
}