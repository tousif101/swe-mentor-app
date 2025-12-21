# Mobile AI Chat Roadmap

> Implementation plan for integrating AI Mentor chat into the mobile app using LangChain backend.

## Overview

Transform the existing `InsightsScreen` into an AI-powered mentor chat experience that:
- Provides personalized career guidance using RAG (journal entries, check-ins, goals)
- Enforces 20 chats/day rate limit with clear UI feedback
- Persists conversation history across sessions
- Delivers a native, fluid chat experience

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ ChatScreen  │──│ useMentor   │──│ API: /api/mentor/chat   │  │
│  │ (UI)        │  │ (Hook)      │  │ (Next.js)               │  │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │
└────────────────────────────────────────────────┼────────────────┘
                                                 │
┌────────────────────────────────────────────────┼────────────────┐
│                       Backend (Next.js)        │                 │
│  ┌─────────────────────────────────────────────▼─────────────┐  │
│  │                   LangChain Agent                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │ GPT-4o   │  │ RAG      │  │ Tools    │  │ Memory   │   │  │
│  │  │ mini     │  │ Search   │  │ (Progress│  │ (History)│   │  │
│  │  └──────────┘  └──────────┘  │ Summary) │  └──────────┘   │  │
│  │                              └──────────┘                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │                     Supabase                                │  │
│  │  conversations │ messages │ document_embeddings │ profiles  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Backend API (Next.js)

> Prerequisite: Complete before mobile work

### 1.1 Database Migration

```sql
-- Run in Supabase SQL Editor

-- Enable vector extension (if not already)
CREATE EXTENSION IF NOT EXISTS vector;

-- Document embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('journal_entry', 'check_in', 'goal')),
  source_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_user ON document_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own embeddings" ON document_embeddings
  FOR ALL USING (auth.uid() = user_id);

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_and_increment_chat_usage(
  p_user_id uuid,
  p_daily_limit int DEFAULT 20
)
RETURNS TABLE (allowed boolean, current_count int, remaining int)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_current_count int;
BEGIN
  INSERT INTO daily_metrics (user_id, date, mentor_messages)
  VALUES (p_user_id, v_today, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  SELECT mentor_messages INTO v_current_count
  FROM daily_metrics WHERE user_id = p_user_id AND date = v_today;

  IF v_current_count < p_daily_limit THEN
    UPDATE daily_metrics SET mentor_messages = mentor_messages + 1
    WHERE user_id = p_user_id AND date = v_today;

    RETURN QUERY SELECT true, v_current_count + 1, p_daily_limit - v_current_count - 1;
  ELSE
    RETURN QUERY SELECT false, v_current_count, 0;
  END IF;
END;
$$;

-- Vector search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT de.id, de.content, de.metadata,
         1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE (filter_user_id IS NULL OR de.user_id = filter_user_id)
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 1.2 Install Dependencies (apps/web)

```bash
cd apps/web
npm install langchain @langchain/core @langchain/openai @langchain/community @langchain/textsplitters @langchain/langgraph
```

### 1.3 Create API Route

Create `apps/web/src/app/api/mentor/chat/route.ts` following the implementation in the LangChain guide.

### 1.4 Verification

- [ ] POST `/api/mentor/chat` returns AI response
- [ ] Rate limiting returns 429 after 20 messages
- [ ] Conversation history persists

---

## Phase 2: Mobile - Chat Hook & API Client

### 2.1 Types

```typescript
// apps/mobile/src/types/chat.ts
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
  messageCount: number
}

export interface ChatResponse {
  response: string
  conversationId: string
  rateLimitInfo: {
    remaining: number
    limit: number
  }
}

export interface RateLimitInfo {
  remaining: number
  limit: number
  resetAt: string
}
```

### 2.2 API Client

```typescript
// apps/mobile/src/lib/mentorApi.ts
import { supabase } from './supabase'
import { ChatResponse, RateLimitInfo, Message } from '../types/chat'
import { withRetry } from '../utils'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await withRetry(() =>
    fetch(`${API_URL}/api/mentor/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        userId: session.user.id,
        message,
        conversationId,
      }),
    })
  )

  if (response.status === 429) {
    const data = await response.json()
    throw new RateLimitError(data.remaining, new Date(data.resetAt))
  }

  if (!response.ok) {
    throw new Error('Failed to send message')
  }

  return response.json()
}

export async function getRemainingChats(): Promise<RateLimitInfo> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await fetch(
    `${API_URL}/api/mentor/chat?userId=${session.user.id}`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    }
  )

  return response.json()
}

export async function getConversationHistory(
  conversationId: string
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.created_at,
  }))
}

export class RateLimitError extends Error {
  constructor(
    public remaining: number,
    public resetAt: Date
  ) {
    super('Rate limit exceeded')
    this.name = 'RateLimitError'
  }
}
```

### 2.3 useMentor Hook

```typescript
// apps/mobile/src/hooks/useMentor.ts
import { useState, useCallback, useEffect } from 'react'
import { Message, RateLimitInfo } from '../types/chat'
import {
  sendMessage as sendMessageApi,
  getRemainingChats,
  getConversationHistory,
  RateLimitError,
} from '../lib/mentorApi'
import { logger } from '../utils'

interface UseMentorOptions {
  conversationId?: string
}

interface UseMentorReturn {
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  error: Error | null
  rateLimitInfo: RateLimitInfo | null
  conversationId: string | null
  sendMessage: (content: string) => Promise<void>
  clearError: () => void
  refreshRateLimit: () => Promise<void>
}

export function useMentor(options?: UseMentorOptions): UseMentorReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(
    options?.conversationId || null
  )

  // Load rate limit on mount
  useEffect(() => {
    refreshRateLimit()
  }, [])

  // Load conversation history if conversationId provided
  useEffect(() => {
    if (options?.conversationId) {
      loadHistory(options.conversationId)
    }
  }, [options?.conversationId])

  const loadHistory = async (convId: string) => {
    setIsLoading(true)
    try {
      const history = await getConversationHistory(convId)
      setMessages(history)
    } catch (err) {
      logger.error('Failed to load history', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshRateLimit = useCallback(async () => {
    try {
      const info = await getRemainingChats()
      setRateLimitInfo(info)
    } catch (err) {
      logger.error('Failed to get rate limit', err)
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    // Optimistic update - add user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsSending(true)
    setError(null)

    try {
      const response = await sendMessageApi(content, conversationId || undefined)

      // Update conversation ID if new
      if (!conversationId) {
        setConversationId(response.conversationId)
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])

      // Update rate limit info
      setRateLimitInfo({
        remaining: response.rateLimitInfo.remaining,
        limit: response.rateLimitInfo.limit,
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
      })
    } catch (err) {
      // Remove optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))

      if (err instanceof RateLimitError) {
        setRateLimitInfo({
          remaining: 0,
          limit: 20,
          resetAt: err.resetAt.toISOString(),
        })
      }
      setError(err as Error)
      logger.error('Failed to send message', err)
    } finally {
      setIsSending(false)
    }
  }, [conversationId])

  const clearError = useCallback(() => setError(null), [])

  return {
    messages,
    isLoading,
    isSending,
    error,
    rateLimitInfo,
    conversationId,
    sendMessage,
    clearError,
    refreshRateLimit,
  }
}
```

---

## Phase 3: Mobile - Chat UI Components

### 3.1 Component Structure

```
src/components/chat/
├── index.ts
├── ChatBubble.tsx       # Individual message bubble
├── ChatInput.tsx        # Input field + send button
├── ChatHeader.tsx       # Title + rate limit indicator
├── RateLimitBanner.tsx  # Shows when limit reached
├── TypingIndicator.tsx  # AI is thinking animation
└── SuggestedPrompts.tsx # Quick starter prompts
```

### 3.2 ChatBubble Component

```typescript
// apps/mobile/src/components/chat/ChatBubble.tsx
import { View, Text } from 'react-native'
import { Message } from '../../types/chat'

interface ChatBubbleProps {
  message: Message
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-600 rounded-br-sm'
            : 'bg-gray-800 rounded-bl-sm'
        }`}
      >
        <Text className={`text-base ${isUser ? 'text-white' : 'text-gray-100'}`}>
          {message.content}
        </Text>
        <Text className={`text-xs mt-1 ${isUser ? 'text-primary-200' : 'text-gray-500'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  )
}
```

### 3.3 ChatInput Component

```typescript
// apps/mobile/src/components/chat/ChatInput.tsx
import { View, TextInput, Pressable, Keyboard } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState, useCallback } from 'react'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('')

  const handleSend = useCallback(() => {
    if (text.trim() && !disabled) {
      onSend(text.trim())
      setText('')
      Keyboard.dismiss()
    }
  }, [text, disabled, onSend])

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(text.trim() ? 1 : 0.8) }],
    opacity: withSpring(text.trim() ? 1 : 0.5),
  }))

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 bg-gray-900 border-t border-gray-800">
      <View className="flex-1 bg-gray-800 rounded-2xl px-4 py-3 max-h-32">
        <TextInput
          className="text-white text-base"
          placeholder={placeholder || "Ask your mentor..."}
          placeholderTextColor="#6b7280"
          value={text}
          onChangeText={setText}
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
      </View>
      <AnimatedPressable
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        style={buttonStyle}
        className="w-12 h-12 bg-primary-600 rounded-full items-center justify-center"
      >
        <Ionicons name="send" size={20} color="white" />
      </AnimatedPressable>
    </View>
  )
}
```

### 3.4 RateLimitBanner Component

```typescript
// apps/mobile/src/components/chat/RateLimitBanner.tsx
import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { RateLimitInfo } from '../../types/chat'

interface RateLimitBannerProps {
  rateLimitInfo: RateLimitInfo
}

export function RateLimitBanner({ rateLimitInfo }: RateLimitBannerProps) {
  const resetTime = new Date(rateLimitInfo.resetAt)
  const hoursUntilReset = Math.ceil(
    (resetTime.getTime() - Date.now()) / (1000 * 60 * 60)
  )

  return (
    <View className="mx-4 my-2 bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 bg-amber-600/20 rounded-full items-center justify-center">
          <Ionicons name="time" size={20} color="#f59e0b" />
        </View>
        <View className="flex-1">
          <Text className="text-amber-400 font-semibold">
            Daily limit reached
          </Text>
          <Text className="text-amber-300/70 text-sm">
            Resets in {hoursUntilReset} hour{hoursUntilReset !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </View>
  )
}
```

### 3.5 TypingIndicator Component

```typescript
// apps/mobile/src/components/chat/TypingIndicator.tsx
import { View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { useEffect } from 'react'

export function TypingIndicator() {
  const dots = [0, 1, 2]

  return (
    <View className="flex-row justify-start mb-3">
      <View className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex-row gap-1">
        {dots.map((index) => (
          <Dot key={index} delay={index * 150} />
        ))}
      </View>
    </View>
  )
}

function Dot({ delay }: { delay: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withDelay(delay, withTiming(1, { duration: 300 })),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      true
    ),
  }))

  return (
    <Animated.View
      style={animatedStyle}
      className="w-2 h-2 bg-gray-400 rounded-full"
    />
  )
}
```

### 3.6 SuggestedPrompts Component

```typescript
// apps/mobile/src/components/chat/SuggestedPrompts.tsx
import { View, Text, Pressable, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

interface Prompt {
  icon: IoniconsName
  text: string
  prompt: string
}

const PROMPTS: Prompt[] = [
  {
    icon: 'trending-up',
    text: 'Weekly progress',
    prompt: "How did I do this week? Give me a summary of my progress.",
  },
  {
    icon: 'bulb',
    text: 'Career advice',
    prompt: "Based on my journal entries, what should I focus on next?",
  },
  {
    icon: 'flag',
    text: 'Goal check',
    prompt: "How am I tracking against my goals?",
  },
  {
    icon: 'battery-charging',
    text: 'Energy patterns',
    prompt: "What patterns do you see in my energy levels?",
  },
]

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <View className="py-4">
      <Text className="text-gray-400 text-sm mb-3 px-4">Try asking:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {PROMPTS.map((prompt, index) => (
          <Pressable
            key={index}
            onPress={() => onSelect(prompt.prompt)}
            className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 flex-row items-center gap-2"
          >
            <Ionicons name={prompt.icon} size={16} color="#8b5cf6" />
            <Text className="text-gray-300 text-sm">{prompt.text}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
```

---

## Phase 4: Mobile - Chat Screen

### 4.1 Transform InsightsScreen to MentorScreen

```typescript
// apps/mobile/src/screens/main/MentorScreen.tsx
import { View, Text, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useMentor } from '../../hooks/useMentor'
import {
  ChatBubble,
  ChatInput,
  RateLimitBanner,
  TypingIndicator,
  SuggestedPrompts,
} from '../../components/chat'
import { useCallback, useRef } from 'react'
import { FlatList as FlatListType } from 'react-native'
import { Message } from '../../types/chat'

export function MentorScreen() {
  const {
    messages,
    isLoading,
    isSending,
    error,
    rateLimitInfo,
    sendMessage,
  } = useMentor()

  const flatListRef = useRef<FlatListType<Message>>(null)

  const handleSend = useCallback((content: string) => {
    sendMessage(content)
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [sendMessage])

  const isRateLimited = rateLimitInfo?.remaining === 0

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <ChatBubble message={item} />
  ), [])

  const renderEmpty = useCallback(() => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-primary-600/20 rounded-full items-center justify-center mb-6">
        <Ionicons name="chatbubbles" size={40} color="#8b5cf6" />
      </View>
      <Text className="text-white text-xl font-semibold text-center mb-2">
        Your AI Mentor
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        Get personalized career advice based on your journal entries, check-ins, and goals.
      </Text>
      <SuggestedPrompts onSelect={handleSend} />
    </View>
  ), [handleSend])

  const renderHeader = () => (
    <View className="px-4 pt-2 pb-4 flex-row items-center justify-between">
      <View>
        <Text className="text-white text-2xl font-bold">Mentor</Text>
        <Text className="text-gray-400 text-sm">AI-powered guidance</Text>
      </View>
      {rateLimitInfo && (
        <View className="bg-gray-800 rounded-full px-3 py-1.5 flex-row items-center gap-1.5">
          <Ionicons name="chatbubble" size={14} color="#8b5cf6" />
          <Text className="text-gray-300 text-sm">
            {rateLimitInfo.remaining}/{rateLimitInfo.limit}
          </Text>
        </View>
      )}
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {renderHeader()}

        {isRateLimited && <RateLimitBanner rateLimitInfo={rateLimitInfo!} />}

        {messages.length === 0 && !isLoading ? (
          renderEmpty()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isSending ? <TypingIndicator /> : null}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            }}
          />
        )}

        <ChatInput
          onSend={handleSend}
          disabled={isRateLimited || isSending}
          placeholder={isRateLimited ? "Daily limit reached" : "Ask your mentor..."}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
```

### 4.2 Update Navigation

```typescript
// Update MainTabNavigator.tsx
import { MentorScreen } from '../screens/main/MentorScreen'

// Change:
<Tab.Screen name="InsightsTab" component={InsightsScreen} />
// To:
<Tab.Screen name="MentorTab" component={MentorScreen} />
```

```typescript
// Update CustomTabBar.tsx icons
// Change insights icon to chatbubbles:
{ name: 'MentorTab', icon: 'chatbubbles', label: 'Mentor' }
```

---

## Phase 5: Polish & Enhancements

### 5.1 Conversation History Screen

Add a screen to view past conversations:

```
src/screens/main/ConversationsScreen.tsx
```

Features:
- List of past conversations with titles
- Tap to continue conversation
- Delete conversations
- Search conversations

### 5.2 Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics'

// On message send
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

// On rate limit reached
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
```

### 5.3 Markdown Rendering

Install and use for AI responses:

```bash
npm install react-native-markdown-display
```

### 5.4 Pull to Refresh Rate Limit

Allow users to refresh their rate limit status.

### 5.5 Offline Queue

Queue messages when offline and send when connected.

---

## Implementation Checklist

### Phase 1: Backend (Next.js)
- [ ] Run database migration
- [ ] Install LangChain dependencies
- [ ] Create `lib/langchain/` directory structure
- [ ] Implement config, tools, rateLimiter, chatHistory
- [ ] Create `/api/mentor/chat` route
- [ ] Test with curl/Postman

### Phase 2: Mobile - Hook & API
- [ ] Add chat types to `types/chat.ts`
- [ ] Create `lib/mentorApi.ts`
- [ ] Create `hooks/useMentor.ts`
- [ ] Add to barrel exports

### Phase 3: Mobile - Components
- [ ] Create `components/chat/` directory
- [ ] Implement ChatBubble
- [ ] Implement ChatInput
- [ ] Implement RateLimitBanner
- [ ] Implement TypingIndicator
- [ ] Implement SuggestedPrompts
- [ ] Create barrel export

### Phase 4: Mobile - Screen
- [ ] Create MentorScreen (replace InsightsScreen)
- [ ] Update MainTabNavigator
- [ ] Update CustomTabBar icons
- [ ] Test end-to-end flow

### Phase 5: Polish
- [ ] Add haptic feedback
- [ ] Add markdown rendering
- [ ] Add conversation history screen
- [ ] Add offline queue
- [ ] Performance optimization

---

## Cost Estimate

| Users | Monthly AI Cost | Notes |
|-------|-----------------|-------|
| 100 | $50 | 20 chats/day × 100 users |
| 500 | $250 | Linear scaling |
| 1,000 | $500 | Consider caching |

---

## Testing Plan

### Unit Tests
- `useMentor` hook behavior
- Rate limit logic
- Message formatting

### Integration Tests
- API endpoint responses
- Supabase queries

### E2E Tests
- Send message flow
- Rate limit enforcement
- Conversation persistence

---

## Success Metrics

- **Engagement**: % of users who use chat weekly
- **Satisfaction**: Average conversation length
- **Retention**: Correlation between chat usage and app retention
- **Performance**: Average response time < 3s
