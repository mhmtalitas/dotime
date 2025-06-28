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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const OverdueTasksScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [overdueTasks, setOverdueTasks] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadOverdueTasks();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOverdueTasks();
    });
    return unsubscribe;
  }, [navigation]);

  const loadOverdueTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const now = new Date();
        const overdue = tasks.filter(task => {
          if (task.completed) return false;
          const deadline = new Date(task.deadline);
          return deadline < now;
        });
        
        // Tarihe göre sırala - en eskisi en üstte
        overdue.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        setOverdueTasks(overdue);
      }
    } catch (error) {
      console.error('Gecikmiş görevler yüklenirken hata:', error);
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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (date.toDateString() === today.toDateString()) {
      return `Bugün ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Dün ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short'
      });
      return `${dateStr} ${timeStr}`;
    }
  };

  const getDaysOverdue = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = now - deadlineDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const markAsCompleted = async (taskId) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.map(task => 
          task.id === taskId 
            ? { ...task, completed: true, completedAt: new Date().toISOString() }
            : task
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        loadOverdueTasks();
        Alert.alert('Başarılı', 'Görev tamamlandı');
      }
    } catch (error) {
      Alert.alert('Hata', 'Görev tamamlanırken bir hata oluştu');
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
    const daysOverdue = getDaysOverdue(item.deadline);
    
    return (
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => navigation.navigate('TaskDetail', { task: item })}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.category) }]}>
            <Text style={styles.priorityText}>{getPriorityText(item.category)}</Text>
          </View>
          <View style={styles.overdueIndicator}>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.overdueText}>
              {daysOverdue === 1 ? '1 gün geçikmiş' : `${daysOverdue} gün geçikmiş`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => confirmComplete(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#28A745" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.taskTitle}>{item.title}</Text>
        
        <View style={styles.taskMeta}>
          <View style={styles.dateTimeContainer}>
            <Ionicons name="time-outline" size={16} color="#FFFFFF" />
            <Text style={styles.taskDate}>
              Son tarih: {formatDateTime(item.deadline)}
            </Text>
          </View>
          
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentIndicator}>
              <Ionicons name="attach" size={16} color="#FFFFFF" />
              <Text style={styles.attachmentText}>
                {item.attachments.length} ek
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.background}
        translucent={false}
      />
      {overdueTasks.length === 0 ? (
        <View style={[styles.emptyState, { paddingTop: insets.top + 50 }]}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#28A745" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Gecikmiş görev yok!</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Tüm görevleriniz zamanında tamamlanmış 🎉
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.header, { 
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            paddingTop: insets.top + 15 
          }]}>
            <View style={styles.headerInfo}>
              <Ionicons name="warning" size={24} color="#FF3B30" />
              <Text style={[styles.headerText, { color: theme.text }]}>
                {overdueTasks.length} gecikmiş görev bulundu
              </Text>
            </View>
          </View>
          
          <FlatList
            data={overdueTasks}
            renderItem={renderTaskCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.taskList}
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
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
  taskList: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E60012',
    
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
  },
  overdueText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completeButton: {
    padding: 4,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskDate: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attachmentText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
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
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default OverdueTasksScreen; 