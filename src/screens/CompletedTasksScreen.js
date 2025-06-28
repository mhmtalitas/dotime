import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const CompletedTasksScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState({});

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCompletedTasks();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCompletedTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const completed = tasks.filter(task => task.completed);
        setCompletedTasks(completed);
        groupTasksByDate(completed);
      }
    } catch (error) {
      console.error('Tamamlanan görevler yüklenirken hata:', error);
    }
  };

  const groupTasksByDate = (tasks) => {
    const grouped = tasks.reduce((groups, task) => {
      const completedDate = new Date(task.completedAt);
      const dateKey = getDateKey(completedDate);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
      return groups;
    }, {});

    setGroupedTasks(grouped);
  };

  const getDateKey = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR');
    }
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

  const restoreTask = async (taskId) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.map(task => 
          task.id === taskId 
            ? { ...task, completed: false, completedAt: null }
            : task
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        loadCompletedTasks();
        Alert.alert('Başarılı', 'Görev geri yüklendi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Görev geri yüklenirken bir hata oluştu');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        loadCompletedTasks();
        Alert.alert('Başarılı', 'Görev kalıcı olarak silindi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Görev silinirken bir hata oluştu');
    }
  };

  const confirmRestore = (task) => {
    Alert.alert(
      'Görevi Geri Yükle',
      `"${task.title}" görevini geri yüklemek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Geri Yükle', onPress: () => restoreTask(task.id) },
      ]
    );
  };

  const confirmDelete = (task) => {
    Alert.alert(
      'Görevi Kalıcı Olarak Sil',
      `"${task.title}" görevini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteTask(task.id) },
      ]
    );
  };

  const clearAllCompleted = () => {
    Alert.alert(
      'Tüm Tamamlanan Görevleri Sil',
      'Tüm tamamlanan görevleri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Tümünü Sil', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const storedTasks = await AsyncStorage.getItem('tasks');
              if (storedTasks) {
                const tasks = JSON.parse(storedTasks);
                const activeTasks = tasks.filter(task => !task.completed);
                await AsyncStorage.setItem('tasks', JSON.stringify(activeTasks));
                loadCompletedTasks();
                Alert.alert('Başarılı', 'Tüm tamamlanan görevler silindi');
              }
            } catch (error) {
              Alert.alert('Hata', 'Görevler silinirken bir hata oluştu');
            }
          }
        },
      ]
    );
  };

  const renderTaskCard = ({ item }) => (
    <View style={[styles.taskCard, { 
      backgroundColor: theme.surface,
      borderColor: theme.border 
    }]}>
      <View style={styles.taskHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.category) }]}>
          <Text style={styles.priorityText}>{getPriorityText(item.category)}</Text>
        </View>
        <Text style={[styles.completedTime, { color: theme.success }]}>
          {new Date(item.completedAt).toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      
      <Text style={[styles.taskTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.taskDescription, { color: theme.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton, { backgroundColor: theme.primary + '20' }]}
          onPress={() => confirmRestore(item)}
        >
          <Ionicons name="refresh-outline" size={16} color={theme.primary} />
          <Text style={[styles.restoreButtonText, { color: theme.primary }]}>Geri Yükle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, { backgroundColor: theme.danger + '20' }]}
          onPress={() => confirmDelete(item)}
        >
          <Ionicons name="trash-outline" size={16} color={theme.danger} />
          <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = ({ item: dateKey }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{dateKey}</Text>
      <FlatList
        data={groupedTasks[dateKey]}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.background}
      />
      <View style={[styles.header, { 
        backgroundColor: theme.background,
        borderBottomColor: theme.border,
        paddingTop: insets.top + 15 
      }]}>
        {completedTasks.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllCompleted}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.clearButtonText}>Tümünü Sil</Text>
          </TouchableOpacity>
        )}
      </View>

      {completedTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz tamamlanan görev yok</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Görevlerinizi tamamladığınızda burada görünecekler
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>{completedTasks.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tamamlanan Görev</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {Math.round(completedTasks.length / Math.max(Object.keys(groupedTasks).length, 1))}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Günlük Ortalama</Text>
            </View>
          </View>

          <FlatList
            data={Object.keys(groupedTasks).sort((a, b) => {
              // Bugün ve Dün'ü en üste koy, diğerlerini tarihe göre sırala
              if (a === 'Bugün') return -1;
              if (b === 'Bugün') return 1;
              if (a === 'Dün') return -1;
              if (b === 'Dün') return 1;
              return new Date(b) - new Date(a);
            })}
            renderItem={renderSection}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sectionsList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  statsCard: {
    margin: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 20,
  },
  sectionsList: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  completedTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  restoreButton: {
  },
  restoreButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
});

export default CompletedTasksScreen; 