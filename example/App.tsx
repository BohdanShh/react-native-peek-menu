import { StatusBar } from 'expo-status-bar';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { PeekMenu, PeekMenuProvider } from 'react-native-peek-menu';

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

export default function App() {
  return (
    <PeekMenuProvider>
      <FlatList
        data={MESSAGES}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <MessageRow message={item} />}
        style={styles.list}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      />
      <StatusBar style="auto" />
    </PeekMenuProvider>
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
  text: {
    fontSize: 16,
    color: '#111',
  },
});
