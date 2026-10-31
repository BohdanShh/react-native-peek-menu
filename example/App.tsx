import { StatusBar } from 'expo-status-bar';
import { FlatList, StyleSheet, Text, View } from 'react-native';
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

const ITEMS = [
  { title: 'Reply', onPress: () => console.log('Reply') },
  { title: 'Copy', onPress: () => console.log('Copy') },
  { title: 'Delete', destructive: true, onPress: () => console.log('Delete') },
];

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
];

function MessageRow({ message }: { message: Message }) {
  return (
    <View style={[styles.row, message.isOwn && styles.ownRow]}>
      <PeekMenu items={ITEMS}>
        <View style={[styles.bubble, message.isOwn && styles.ownBubble]}>
          <Text style={styles.text}>{message.text}</Text>
        </View>
      </PeekMenu>
    </View>
  );
}

function Chat() {
  const insets = useSafeAreaInsets();

  return (
    <PeekMenuProvider safeAreaInsets={insets}>
      <FlatList
        data={MESSAGES}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <MessageRow message={item} />}
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 },
        ]}
      />
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
  list: {
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
});
