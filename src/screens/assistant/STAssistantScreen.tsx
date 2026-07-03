import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  assistantApi,
  type AssistantMessageDto,
} from '../../api/assistant';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { radius, spacing, type ThemeColors } from '../../theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTIONS = [
  '¿Qué debo hacer si me roban el celular?',
  '¿Cómo denuncio un caso de extorsión?',
  '¿Qué evidencias necesito para una denuncia?',
  '¿Dónde está la comisaría más cercana a San Miguel?',
  '¿Qué es el número 119 y cómo se usa?',
  '¿Cómo protejo mis evidencias digitales?',
];

function now() {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createMessage(role: Message['role'], content: string): Message {
  return {
    id: `${Date.now()}-${Math.random()}`,
    role,
    content,
    timestamp: now(),
  };
}

function getLocalFallbackReply(message: string) {
  const text = message.toLowerCase();

  if (text.includes('celular') || text.includes('roban') || text.includes('robo')) {
    return 'Reporta el robo a tu operador para bloquear la línea y el IMEI. Luego registra el caso y guarda cualquier evidencia como ubicación, capturas o mensajes.';
  }

  if (text.includes('extorsión') || text.includes('extorsion')) {
    return 'No respondas con información personal. Guarda capturas, números, audios y horarios. Registra el caso y busca apoyo de una autoridad competente.';
  }

  if (text.includes('evidencia') || text.includes('foto') || text.includes('video')) {
    return 'Las mejores evidencias son capturas, fotos, videos, audios, documentos, fechas, horas, ubicación y datos de contacto relacionados al caso.';
  }

  if (text.includes('comisaría') || text.includes('comisaria')) {
    return 'Puedes revisar el mapa de emergencia o buscar la comisaría más cercana según tu ubicación actual.';
  }

  if (text.includes('119')) {
    return 'El 119 es un servicio para dejar mensajes de voz en situaciones de emergencia cuando las comunicaciones están congestionadas.';
  }

  if (text.includes('digital') || text.includes('proteger')) {
    return 'No edites los archivos originales. Guarda copias, conserva fechas, evita reenviar innecesariamente y sube la evidencia a SecureTrace.';
  }

  return 'Puedo orientarte sobre emergencias, denuncias, evidencias digitales y uso de SecureTrace.';
}

function renderAssistantContent(text: string, colors: ThemeColors) {
  return text.split(/\*\*(.*?)\*\*/g).map((part, index) => {
    if (index % 2 === 1) {
      return (
        <Text key={`${part}-${index}`} style={{ fontWeight: '800', color: colors.text }}>
          {part}
        </Text>
      );
    }

    return part;
  });
}

export function STAssistantScreen() {
  const { colors } = useTheme();
  const { user } = useAuthContext();
  const styles = createStyles(colors);
  const scrollRef = useRef<ScrollView | null>(null);

  const firstName = user?.name ? user.name.split(' ')[0] : '';

  const initialMessage = useMemo<Message>(
    () => ({
      id: '0',
      role: 'assistant',
      content: `Hola${firstName ? `, ${firstName}` : ''}. Soy el **ST Assistant**, tu asistente de seguridad ciudadana. Puedo ayudarte a entender qué hacer ante diferentes situaciones, qué evidencias recopilar y a qué entidades acudir. ¿En qué puedo ayudarte hoy?`,
      timestamp: now(),
    }),
    [firstName],
  );

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const showSuggestions = messages.length === 1 && !loading;

  function resetConversation() {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `Hola${firstName ? `, ${firstName}` : ''}. Soy el **ST Assistant**. ¿En qué puedo ayudarte?`,
        timestamp: now(),
      },
    ]);
    setInput('');
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();

    if (!content || loading) return;

    const userMessage = createMessage('user', content);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const payload: AssistantMessageDto[] = nextMessages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await assistantApi.chat({ messages: payload });

      setMessages((current) => [
        ...current,
        createMessage('assistant', response.reply),
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          `No pude conectar con el servidor ahora. Como guía rápida: ${getLocalFallbackReply(content)}`,
        ),
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.botIconBox}>
              <Ionicons name="chatbubble-ellipses" size={19} color={colors.accent} />
            </View>

            <View>
              <Text style={styles.headerTitle}>ST Assistant</Text>

              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>En línea</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={resetConversation}
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="refresh" size={13} color={colors.textMuted} />
            <Text style={styles.resetText}>Nueva conversación</Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isUser && styles.userMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.avatar,
                    isUser ? styles.userAvatar : styles.botAvatar,
                  ]}
                >
                  <Ionicons
                    name={isUser ? 'person' : 'chatbubble-ellipses'}
                    size={15}
                    color={isUser ? colors.primary : colors.accent}
                  />
                </View>

                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userText : styles.botText,
                    ]}
                  >
                    {isUser
                      ? message.content
                      : renderAssistantContent(message.content, colors)}
                  </Text>

                  <Text
                    style={[
                      styles.timestamp,
                      isUser ? styles.userTimestamp : styles.botTimestamp,
                    ]}
                  >
                    {message.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={styles.messageRow}>
              <View style={[styles.avatar, styles.botAvatar]}>
                <Ionicons name="chatbubble-ellipses" size={15} color={colors.accent} />
              </View>

              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.loadingText}>ST Assistant está escribiendo...</Text>
              </View>
            </View>
          )}

          {showSuggestions && (
            <View style={styles.suggestionsBlock}>
              <View style={styles.suggestionsTitleRow}>
                <Ionicons name="sparkles" size={13} color={colors.textMuted} />
                <Text style={styles.suggestionsTitle}>Preguntas frecuentes</Text>
              </View>

              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => {
                      void sendMessage(suggestion);
                    }}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.inputBox}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu consulta..."
              placeholderTextColor={colors.textSoft}
              style={styles.input}
              multiline
              editable={!loading}
            />

            <Pressable
              onPress={() => {
                void sendMessage();
              }}
              disabled={!input.trim() || loading}
              style={[
                styles.sendButton,
                (!input.trim() || loading) && styles.sendButtonDisabled,
              ]}
            >
              <Ionicons name="send" size={16} color={colors.textInverse} />
            </Pressable>
          </View>

          <Text style={styles.disclaimer}>
            ST Assistant puede cometer errores. Verifica información importante con fuentes oficiales.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    keyboard: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },

    botIconBox: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySofter,
    },

    headerTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 2,
    },

    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },

    statusText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },

    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },

    resetText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '700',
    },

    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.98 }],
    },

    messages: {
      flex: 1,
    },

    messagesContent: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },

    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },

    userMessageRow: {
      flexDirection: 'row-reverse',
    },

    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },

    botAvatar: {
      backgroundColor: colors.primarySofter,
    },

    userAvatar: {
      backgroundColor: colors.primarySoft,
    },

    bubble: {
      maxWidth: '78%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },

    botBubble: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopLeftRadius: radius.sm,
      borderTopRightRadius: radius.lg,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },

    userBubble: {
      backgroundColor: colors.primary,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.sm,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },

    messageText: {
      fontSize: 14,
      lineHeight: 21,
    },

    botText: {
      color: colors.text,
    },

    userText: {
      color: colors.textInverse,
      fontWeight: '600',
    },

    timestamp: {
      fontSize: 11,
      marginTop: spacing.xs,
    },

    botTimestamp: {
      color: colors.textMuted,
    },

    userTimestamp: {
      color: 'rgba(255,255,255,0.7)',
    },

    loadingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderTopLeftRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    loadingText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },

    suggestionsBlock: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },

    suggestionsTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    suggestionsTitle: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '700',
    },

    suggestionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },

    suggestionChip: {
      maxWidth: '100%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    suggestionText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },

    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    inputBox: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },

    input: {
      flex: 1,
      minHeight: 38,
      maxHeight: 110,
      color: colors.text,
      fontSize: 14,
      paddingVertical: spacing.xs,
    },

    sendButton: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },

    sendButtonDisabled: {
      backgroundColor: colors.borderStrong,
      opacity: 0.55,
    },

    disclaimer: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 11,
      marginTop: spacing.sm,
      lineHeight: 16,
    },
  });
}