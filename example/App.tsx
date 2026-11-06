import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PeekMenu, PeekMenuProvider } from 'react-native-peek-menu';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

type Message = {
  id: string;
  text: string;
  isOwn: boolean;
};

const LONG_MESSAGE =
  'So here is everything that happened on the way to the station this morning. '.repeat(40);

const INITIAL_MESSAGES: Message[] = [
  { id: '1', text: 'Hey! Are you free tonight?', isOwn: false },
  { id: '2', text: 'Should be, what are you thinking?', isOwn: true },
  { id: '3', text: 'That new ramen place finally opened', isOwn: false },
  { id: '4', text: 'The one near the station?', isOwn: true },
  { id: '5', text: 'Yes! Apparently the queue moves pretty fast on weekdays', isOwn: false },
  { id: '6', text: 'Perfect', isOwn: true },
  { id: '7', text: "I'll finish work around seven, so we could meet at half past", isOwn: true },
  { id: '8', text: 'Works for me', isOwn: false },
  { id: '9', text: 'Should I book a table?', isOwn: false },
  { id: '10', text: "I don't think they take bookings", isOwn: true },
  { id: '11', text: 'Fair enough, we will take our chances then', isOwn: false },
  { id: '12', text: 'See you there 🍜', isOwn: true },
  { id: '13', text: 'Did you see the photos from last weekend?', isOwn: false },
  { id: '14', text: 'Not yet, send them over', isOwn: true },
  { id: '15', text: 'Uploading now, the signal here is terrible', isOwn: false },
  { id: '16', text: 'No rush', isOwn: true },
  { id: '17', text: 'Got them! The one from the lake is great', isOwn: true },
  { id: '18', text: 'I nearly fell in trying to take it', isOwn: false },
  { id: '19', text: 'Worth it though', isOwn: true },
  {
    id: '20',
    text: 'Also, are we still on for the hike next Saturday? The forecast looks decent so far, but it might turn rainy in the afternoon, so maybe we should start earlier than we planned',
    isOwn: false,
  },
  { id: '21', text: 'Sure, how early are we talking?', isOwn: true },
  { id: '22', text: 'Eight?', isOwn: false },
  { id: '23', text: "That's a lot earlier than I hoped", isOwn: true },
  { id: '24', text: 'Half past eight then', isOwn: false },
  { id: '25', text: 'Deal', isOwn: true },
  { id: '26', text: "I'll bring snacks", isOwn: false },
  { id: '27', text: "I'll bring the coffee", isOwn: true },
  { id: '28', text: 'Best plan so far', isOwn: false },
  { id: '29', text: 'Running a bit late by the way, the train got delayed', isOwn: true },
  { id: '30', text: "No worries, I'll grab a spot in the queue", isOwn: false },
  { id: '31', text: "You're the best", isOwn: true },
  { id: '32', text: 'I know 😄', isOwn: false },
  { id: '33', text: LONG_MESSAGE, isOwn: true },
  { id: '34', text: 'Sorry, that was a long one', isOwn: true },
];

// How long after a menu opens the "while open" switches change the list.
const WHILE_OPEN_DELAY = 1500;

type MessageRowProps = {
  message: Message;
  isSelected: boolean;
  onTap: (id: string) => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
};

function MessageRow({ message, isSelected, onTap, onDelete, onOpen }: MessageRowProps) {
  return (
    <View style={[styles.row, message.isOwn && styles.ownRow]}>
      <PeekMenu
        items={[
          { title: 'Reply', onPress: () => console.log('Reply', message.id) },
          { title: 'Copy', onPress: () => console.log('Copy', message.id) },
          { title: 'Edit', disabled: true, onPress: () => console.log('Edit', message.id) },
          { title: 'Delete', destructive: true, onPress: () => onDelete(message.id) },
        ]}
        onOpen={() => onOpen(message.id)}
        onClose={() => console.log('Menu closed', message.id)}
      >
        {/* Check 2: a tap selects the bubble, so it must stay unselected after a hold. */}
        <Pressable
          onPress={() => onTap(message.id)}
          style={[
            styles.bubble,
            message.isOwn && styles.ownBubble,
            isSelected && styles.selectedBubble,
          ]}
        >
          <Text style={styles.text}>{message.text}</Text>
        </Pressable>
      </PeekMenu>
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function Chat() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [addWhileOpen, setAddWhileOpen] = useState(false);
  const [deleteWhileOpen, setDeleteWhileOpen] = useState(false);
  const nextId = useRef(INITIAL_MESSAGES.length + 1);

  const addMessage = (text: string, isOwn: boolean) => {
    const id = String(nextId.current++);

    setMessages((current) => [...current, { id, text, isOwn }]);
  };

  const deleteMessage = (id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  };

  const handleTap = (id: string) => {
    console.log('Bubble tapped', id);
    setSelectedId((current) => (current === id ? null : id));
  };

  // Check 3: the list changes under the open menu.
  const handleOpen = (id: string) => {
    console.log('Menu opened', id);

    if (addWhileOpen) {
      setTimeout(
        () => addMessage('A new message arrived while the menu was open', false),
        WHILE_OPEN_DELAY,
      );
    }

    if (deleteWhileOpen) {
      setTimeout(() => deleteMessage(id), WHILE_OPEN_DELAY);
    }
  };

  const send = () => {
    if (draft.trim()) {
      addMessage(draft.trim(), true);
      setDraft('');
    }
  };

  return (
    <PeekMenuProvider safeAreaInsets={insets}>
      <View style={[styles.panel, { paddingTop: insets.top + 6 }]}>
        <Toggle label="New message while open" value={addWhileOpen} onChange={setAddWhileOpen} />
        <Toggle
          label="Delete the held message while open"
          value={deleteWhileOpen}
          onChange={setDeleteWhileOpen}
        />
      </View>
      {/* Check 1: with the keyboard up, hold the last messages. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <FlatList
          data={messages}
          keyExtractor={(message) => message.id}
          renderItem={({ item }) => (
            <MessageRow
              message={item}
              isSelected={item.id === selectedId}
              onTap={handleTap}
              onDelete={deleteMessage}
              onOpen={handleOpen}
            />
          )}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={styles.content}
        />
        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            placeholder="Message"
            returnKeyType="send"
            style={styles.input}
          />
        </View>
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </PeekMenuProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Chat />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  panel: {
    gap: 4,
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: '#F4F6F8',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
  },
  list: {
    flex: 1,
    backgroundColor: '#DCE6EE',
  },
  content: {
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  row: {
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  ownRow: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFF',
  },
  ownBubble: {
    backgroundColor: '#D9FDD3',
  },
  selectedBubble: {
    borderWidth: 2,
    borderColor: '#2F80ED',
  },
  text: {
    fontSize: 16,
    color: '#111',
  },
  composer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    backgroundColor: '#F4F6F8',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
});
