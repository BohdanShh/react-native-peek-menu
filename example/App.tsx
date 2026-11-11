import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import {
  PeekMenu,
  PeekMenuProvider,
  type PeekMenuClipInsets,
  type PeekMenuItem,
} from 'react-native-peek-menu';
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

const ITEMS: PeekMenuItem[] = [
  { title: 'Reply', onPress: () => console.log('Reply') },
  { title: 'Copy', onPress: () => console.log('Copy') },
  { title: 'Edit', disabled: true, onPress: () => console.log('Edit') },
  { title: 'Delete', destructive: true, onPress: () => console.log('Delete') },
];

const LONG_MESSAGE =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(
    12,
  );

const MESSAGES: Message[] = [
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
  { id: '13', text: LONG_MESSAGE, isOwn: false },
  { id: '14', text: 'Sorry, that was a long one', isOwn: false },
];

function MessageRow({ message, clipInsets }: { message: Message; clipInsets: PeekMenuClipInsets }) {
  return (
    <View style={[styles.row, message.isOwn && styles.ownRow]}>
      <PeekMenu items={ITEMS} clipInsets={clipInsets}>
        <View style={[styles.bubble, message.isOwn && styles.ownBubble]}>
          <Text style={styles.text}>{message.text}</Text>
        </View>
      </PeekMenu>
    </View>
  );
}

function Chat() {
  const insets = useSafeAreaInsets();
  const [clipInsets, setClipInsets] = useState({ top: 0, bottom: 0 });

  return (
    <PeekMenuProvider safeAreaInsets={insets}>
      <View style={styles.screen}>
        <FlatList
          data={MESSAGES}
          keyExtractor={(message) => message.id}
          renderItem={({ item }) => <MessageRow message={item} clipInsets={clipInsets} />}
          style={StyleSheet.absoluteFill}
          contentContainerStyle={[
            styles.content,
            { paddingTop: clipInsets.top + 12, paddingBottom: clipInsets.bottom + 12 },
          ]}
        />
        <View
          onLayout={(event) => {
            const top = event.nativeEvent.layout.height;
            setClipInsets((current) => ({ ...current, top }));
          }}
          style={[styles.bar, styles.header, { paddingTop: insets.top + 12 }]}
        >
          <Text style={styles.title}>Peek Menu</Text>
        </View>
        <View
          onLayout={(event) => {
            const bottom = event.nativeEvent.layout.height;
            setClipInsets((current) => ({ ...current, bottom }));
          }}
          style={[styles.bar, styles.composer, { paddingBottom: insets.bottom + 8 }]}
        >
          <View style={styles.input}>
            <Text style={styles.placeholder}>Message</Text>
          </View>
        </View>
      </View>
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
  screen: {
    flex: 1,
    backgroundColor: '#DCE6EE',
  },
  content: {
    gap: 6,
    paddingHorizontal: 10,
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
  text: {
    fontSize: 16,
    color: '#111',
  },
  bar: {
    position: 'absolute',
    right: 0,
    left: 0,
    paddingHorizontal: 12,
    backgroundColor: '#F7F7F7',
  },
  header: {
    top: 0,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  composer: {
    bottom: 0,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111',
  },
  input: {
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFF',
  },
  placeholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
