import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messagesApi } from '../../api/messages';
import { ConfirmModal } from '../ui/Modal';
import { useAuthContext } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { colors, radius, spacing } from '../../theme';
import type { Message } from '../../types';

interface Props {
  caseId: number;
}

export function MessageThread({ caseId }: Props) {
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messagesApi.byCase(caseId);
      setMessages(data);
    } catch {
      // silent — empty list on error
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { void load(); }, [load]);

  const scrollToEnd = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    try {
      const msg = await messagesApi.create({
        caseId,
        authorId: user.id,
        content: text.trim(),
      });
      setMessages((prev) => [...prev, msg]);
      setText('');
      scrollToEnd();
    } catch {
      showToast('No se pudo enviar el mensaje', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    try {
      const updated = await messagesApi.update(editingId, editText.trim());
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
    } catch {
      showToast('No se pudo editar el mensaje', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await messagesApi.remove(deleteTarget.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      showToast('No se pudo eliminar el mensaje', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const isOwn = (msg: Message) => msg.authorId === user?.id;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Mensajes</Text>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ margin: spacing.lg }} />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            onContentSizeChange={scrollToEnd}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aún no hay mensajes</Text>
                <Text style={styles.emptyHint}>Sé el primero en escribir en este caso.</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const own = isOwn(msg);
                if (editingId === msg.id) {
                  return (
                    <View key={msg.id} style={[styles.row, own ? styles.rowOwn : styles.rowOther]}>
                      <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther]}>
                        <TextInput
                          value={editText}
                          onChangeText={setEditText}
                          multiline
                          style={[styles.editInput, own && styles.editInputOwn]}
                          autoFocus
                        />
                        <View style={styles.editActions}>
                          <Pressable onPress={handleSaveEdit} style={styles.editActionBtn}>
                            <Text style={styles.editSave}>Guardar</Text>
                          </Pressable>
                          <Pressable onPress={() => setEditingId(null)} style={styles.editActionBtn}>
                            <Text style={styles.editCancel}>Cancelar</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                }
                return (
                  <View key={msg.id} style={[styles.row, own ? styles.rowOwn : styles.rowOther]}>
                    <View style={[styles.bubble, own ? styles.bubbleOwn : styles.bubbleOther]}>
                      {!own && msg.authorName && (
                        <Text style={styles.authorName}>{msg.authorName}</Text>
                      )}
                      <Text style={[styles.msgText, own && styles.msgTextOwn]}>
                        {msg.content}
                      </Text>
                      <View style={[styles.metaRow, own && styles.metaRowOwn]}>
                        <Text style={[styles.msgTime, own && styles.msgTimeOwn]}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        {own && (
                          <View style={styles.msgActions}>
                            <Pressable
                              onPress={() => { setEditingId(msg.id); setEditText(msg.content); }}
                              hitSlop={8}
                            >
                              <Ionicons name="pencil-outline" size={13} color="rgba(255,255,255,0.75)" />
                            </Pressable>
                            <Pressable onPress={() => setDeleteTarget(msg)} hitSlop={8}>
                              <Ionicons name="trash-outline" size={13} color="rgba(255,255,255,0.75)" />
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>

      {/* Input de envío */}
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
        >
          {sending ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Ionicons name="send" size={18} color={colors.textInverse} />
          )}
        </Pressable>
      </View>

      <ConfirmModal
        visible={!!deleteTarget}
        title="Eliminar mensaje"
        message="¿Estás seguro? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  listContainer: { minHeight: 160, maxHeight: 360 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  emptyHint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },

  row: { flexDirection: 'row', marginVertical: 2 },
  rowOwn: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '78%',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleOwn: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.background, borderBottomLeftRadius: 4 },

  authorName: { fontSize: 11, fontWeight: '700', color: colors.primaryDark, marginBottom: 2 },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  msgTextOwn: { color: colors.textInverse },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  metaRowOwn: { justifyContent: 'flex-end' },
  msgTime: { fontSize: 10, color: colors.textMuted },
  msgTimeOwn: { color: 'rgba(255,255,255,0.65)' },
  msgActions: { flexDirection: 'row', gap: spacing.sm },

  editInput: {
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 48,
    backgroundColor: colors.surface,
  },
  editInputOwn: { color: colors.textInverse, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent' },
  editActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  editActionBtn: { paddingVertical: 2 },
  editSave: { fontSize: 13, fontWeight: '700', color: colors.accent },
  editCancel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});
