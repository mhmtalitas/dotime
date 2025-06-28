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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTasks = async () => {
    try {
      console.log('Loading tasks...');
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        try {
          const parsedTasks = JSON.parse(storedTasks);
          if (!Array.isArray(parsedTasks)) {
            console.error('Stored tasks is not an array:', parsedTasks);
            setTasks([]);
            return;
          }
          // Sadece tamamlanmamış görevleri göster ve tarihe göre sırala
          const incompleteTasks = parsedTasks
            .filter(task => {
              if (!task || typeof task !== 'object') {
                console.error('Invalid task object:', task);
                return false;
              }
              return !task.completed;
            })
            .sort((a, b) => {
              try {
                const dateA = new Date(a.deadline);
                const dateB = new Date(b.deadline);
                return dateA - dateB; // Yakın tarihli görevler önce gelecek
              } catch (error) {
                console.error('Date sorting error:', error);
                return 0;
              }
            });

          console.log('Tasks loaded and sorted successfully:', incompleteTasks.length);
          setTasks(incompleteTasks);
        } catch (parseError) {
          console.error('Tasks parsing error:', parseError);
          setTasks([]);
        }
      } else {
        console.log('No stored tasks found');
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
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
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    if (date.toDateString() === today.toDateString()) {
      return `Bugün ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Yarın ${timeStr}`;
    } else {
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      const dateStr = `${date.getDate()} ${months[date.getMonth()]}`;
      return `${dateStr} ${timeStr}`;
    }
  };

  const markAsCompleted = async (taskId) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        const updatedTasks = parsedTasks.map(task => 
          task.id === taskId ? { ...task, completed: true, completedAt: new Date().getTime() } : task
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        loadTasks();
      }
    } catch (error) {
      console.error('Görev tamamlanırken hata:', error);
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

  // Süresi geçen görev kontrolü
  const isOverdue = (deadline) => {
    const deadlineDate = typeof deadline === 'number' ? new Date(deadline) : new Date(deadline);
    return deadlineDate < new Date();
  };

  const isTaskDueSoon = (deadline) => {
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diffTime = deadlineDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && diffDays >= 0; // 2 gün veya daha az kaldıysa
    } catch (error) {
      console.error('Date comparison error:', error);
      return false;
    }
  };

  const renderTaskCard = ({ item }) => {
    const overdueStatus = isOverdue(item.deadline);
    const dueSoon = !overdueStatus && isTaskDueSoon(item.deadline);
    
    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          { backgroundColor: overdueStatus ? '#FF3B30' : theme.surface },
          overdueStatus && styles.overdueTaskCard,
          dueSoon && styles.dueSoonCard
        ]}
        onPress={() => navigation.navigate('TaskDetail', { task: item })}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.category) }]}>
            <Text style={styles.priorityText}>{getPriorityText(item.category)}</Text>
          </View>
          {overdueStatus && (
            <View style={styles.overdueIndicator}>
              <Ionicons name="warning" size={16} color="#FFFFFF" />
              <Text style={styles.overdueText}>GECİKMİŞ</Text>
            </View>
          )}
          {dueSoon && (
            <View style={styles.dueSoonIndicator}>
              <Ionicons name="time" size={16} color="#FF9500" />
              <Text style={styles.dueSoonText}>YAKLAŞIYOR</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => confirmComplete(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#28A745" />
          </TouchableOpacity>
        </View>
        
        <Text style={[
          styles.taskTitle,
          { color: overdueStatus ? '#FFFFFF' : theme.text },
          overdueStatus && styles.overdueTaskTitle
        ]}>
          {item.title}
        </Text>
        
        <View style={styles.taskMeta}>
          <View style={styles.dateTimeContainer}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={overdueStatus ? "#FFFFFF" : dueSoon ? "#FF9500" : "#007AFF"} 
            />
            <Text style={[
              styles.taskDate,
              { color: overdueStatus ? '#FFFFFF' : dueSoon ? "#FF9500" : theme.primary },
              overdueStatus && styles.overdueTaskDate
            ]}>
              {formatDateTime(item.deadline)}
            </Text>
          </View>
          
          {item.attachments && item.attachments.length > 0 && (
            <View style={[
              styles.attachmentIndicator,
              overdueStatus && styles.overdueAttachmentIndicator
            ]}>
              <Ionicons 
                name="attach" 
                size={16} 
                color={overdueStatus ? "#FFFFFF" : "#6C757D"} 
              />
              <Text style={[
                styles.attachmentText,
                { color: overdueStatus ? '#FFFFFF' : theme.textSecondary },
                overdueStatus && styles.overdueAttachmentText
              ]}>
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
      <View style={[styles.header, { 
        paddingTop: insets.top + 15,
        backgroundColor: theme.background,
        borderBottomColor: theme.border
      }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Görevlerim</Text>
        </View>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz görev eklenmemiş</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            İlk görevinizi eklemek için + butonuna tıklayın
          </Text>
          <TouchableOpacity
            style={[styles.addFirstTaskButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('AddTask')}
          >
            <Text style={styles.addFirstTaskText}>İlk Görevimi Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.taskList}
        />
      )}

      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddTask')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },

  taskList: {
    padding: 20,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  overdueTaskCard: {
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#E60012',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.3,
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
  completeButton: {
    padding: 4,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  overdueTaskTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    fontWeight: '500',
    marginLeft: 6,
  },
  overdueTaskDate: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attachmentText: {
    fontSize: 12,
    marginLeft: 4,
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  overdueText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  overdueAttachmentIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  overdueAttachmentText: {
    color: '#FFFFFF',
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
    marginBottom: 24,
  },
  addFirstTaskButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstTaskText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  dueSoonCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  dueSoonIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF950020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  dueSoonText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default HomeScreen; 