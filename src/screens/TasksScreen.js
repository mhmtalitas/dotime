import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getPriorityText = (priority) => {
  switch (priority) {
    case 'Urgent':
      return 'Acil';
    case 'Important':
      return 'Önemli';
    case 'Work':
      return 'İş';
    case 'Personal':
      return 'Kişisel';
    default:
      return 'Normal';
  }
};

const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const today = new Date();
    
    const options = { hour: '2-digit', minute: '2-digit' };
    const time = date.toLocaleTimeString('tr-TR', options);

    if (date.toDateString() === today.toDateString()) {
        return `Bugün ${time}`;
    }
    
    const day = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return `${day} ${time}`;
};

const TasksScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState([]);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const filter = route.params?.filter;
  const title = route.params?.title || 'Tüm Görevler';

  useEffect(() => {
    if (isFocused) {
      loadTasks();
    }
  }, [isFocused]);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        if (Array.isArray(parsedTasks)) {
          const incompleteTasks = parsedTasks
            .filter(task => task && !task.completed)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
          setTasks(incompleteTasks);
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  const getDeadlineColor = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = (deadlineDate.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return theme.danger; // Overdue
    if (diffDays < 1) return '#FF9500'; // Due today (Orange)
    return theme.textSecondary; // Not urgent
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return '#FF3B30';
      case 'Important':
        return '#007AFF';
      case 'Work':
        return '#6F42C1';
      case 'Personal':
        return '#28A745';
      default:
        return '#6C757D';
    }
  };

  const isTaskOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const markAsCompleted = async (taskId) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        const updatedTasks = parsedTasks.map(task => 
          task.id === taskId ? { ...task, completed: true, completedAt: new Date().toISOString() } : task
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        loadTasks(); // Listeyi yenile
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const confirmComplete = (task) => {
    Alert.alert(
      'Görevi Tamamla',
      `"${task.title}" görevini tamamladınız mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Tamamla', onPress: () => markAsCompleted(task.id) },
      ]
    );
  };
  
  const renderTaskCard = ({ item }) => {
    const isOverdue = isTaskOverdue(item.deadline);
    const categoryColor = getPriorityColor(item.category);

    const cardStyle = isOverdue 
        ? [styles.card, { backgroundColor: theme.danger }] 
        : [styles.card, { backgroundColor: theme.surface, borderColor: categoryColor, borderWidth: 1.5 }];

    const textColor = isOverdue ? '#fff' : theme.text;
    const deadlineColor = isOverdue ? '#fff' : categoryColor;
    const checkmarkColor = isOverdue ? '#fff' : theme.success;

    return (
        <TouchableOpacity 
            style={cardStyle}
            onPress={() => navigation.navigate('TaskDetail', { task: item })}
            onLongPress={() => confirmComplete(item)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                    <Text style={styles.categoryText}>{getPriorityText(item.category)}</Text>
                </View>
                {isOverdue && (
                    <View style={styles.statusBadge}>
                        <Ionicons name="alert-circle-outline" size={14} color="#fff" />
                        <Text style={styles.statusText}>GECİKMİŞ</Text>
                    </View>
                )}
                <TouchableOpacity onPress={() => confirmComplete(item)} style={styles.completeButton}>
                     <Ionicons name="checkmark-circle-outline" size={26} color={checkmarkColor} />
                </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
            
            <View style={styles.footer}>
                <Ionicons name="time-outline" size={16} color={deadlineColor} />
                <Text style={[styles.deadline, { color: deadlineColor }]}>
                    {formatDeadline(item.deadline)}
                </Text>
            </View>
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.primary}
        translucent={false}
      />
       {tasks.length === 0 ? (
         <View style={styles.emptyState}>
           <Ionicons name="list-outline" size={64} color={theme.textSecondary} />
           <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz görev yok</Text>
           <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
             İlk görevinizi eklemek için + butonuna tıklayın
           </Text>
         </View>
       ) : (
         <FlatList
           data={tasks}
           renderItem={renderTaskCard}
           keyExtractor={(item) => item.id}
           contentContainerStyle={styles.taskList}
         />
       )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  taskList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -45 }],
  },
  statusText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeButton: {
    // position: 'absolute',
    // top: 12,
    // right: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  deadline: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default TasksScreen; 