import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const TasksScreen = ({ navigation }) => {
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadStats();
    });
    return unsubscribe;
  }, [navigation]);

  const loadStats = async () => {
    try {
      console.log('Loading task statistics...');
      const storedTasks = await AsyncStorage.getItem('tasks');
      
      // Varsayılan değerler
      let stats = {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0
      };
      
      if (storedTasks) {
        try {
          const tasks = JSON.parse(storedTasks);
          
          if (!Array.isArray(tasks)) {
            console.error('Stored tasks is not an array:', tasks);
            setTaskStats(stats);
            setRecentTasks([]);
            return;
          }
          
          const validTasks = tasks.filter(task => task && typeof task === 'object');
          
          stats.total = validTasks.length;
          stats.completed = validTasks.filter(task => task.completed).length;
          stats.pending = validTasks.filter(task => !task.completed).length;
          
          // Süresi geçmiş görevleri bul
          const now = new Date();
          stats.overdue = validTasks.filter(task => {
            if (task.completed) return false;
            try {
              const deadline = new Date(task.deadline);
              return deadline < now;
            } catch (dateError) {
              console.error('Invalid date format for task:', task);
              return false;
            }
          }).length;

          console.log('Stats calculated successfully:', stats);
          setTaskStats(stats);

          // Son 5 aktif görevi al
          const activeTasks = validTasks
            .filter(task => !task.completed)
            .sort((a, b) => {
              try {
                return new Date(a.deadline) - new Date(b.deadline);
              } catch (dateError) {
                console.error('Date comparison error:', dateError);
                return 0;
              }
            })
            .slice(0, 5);
          
          console.log('Recent tasks loaded:', activeTasks.length);
          setRecentTasks(activeTasks);
        } catch (parseError) {
          console.error('Tasks parsing error:', parseError);
          setTaskStats(stats);
          setRecentTasks([]);
        }
      } else {
        console.log('No stored tasks found');
        setTaskStats(stats);
        setRecentTasks([]);
      }
    } catch (error) {
      console.error('Error loading task statistics:', error);
      setTaskStats({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0
      });
      setRecentTasks([]);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Yarın';
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const renderQuickAction = (icon, title, subtitle, onPress, color = '#007AFF') => (
    <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.quickActionText}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.taskItem, { borderBottomColor: theme.border }]}
      onPress={() => navigation.navigate('TaskDetail', { task: item })}
    >
      <View style={styles.taskItemHeader}>
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.category) }]} />
        <Text style={[styles.taskItemTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        {isOverdue(item.deadline) && (
          <View style={styles.overdueIndicator}>
            <Text style={styles.overdueText}>GEÇİKMİŞ</Text>
          </View>
        )}
      </View>
      <Text style={[
        styles.taskItemDate,
        { color: theme.primary },
        isOverdue(item.deadline) && styles.overdueDate
      ]}>
        {formatDate(item.deadline)}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Görev Özeti</Text>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.content}>
            {/* İstatistik Kartları */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.primaryCard]}>
                  <Text style={styles.statNumber}>{taskStats.total}</Text>
                  <Text style={styles.statLabel}>Toplam Görev</Text>
                </View>
                
                <View style={[styles.statCard, styles.successCard]}>
                  <Text style={styles.statNumber}>{taskStats.completed}</Text>
                  <Text style={styles.statLabel}>Tamamlanan</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.warningCard]}>
                  <Text style={styles.statNumber}>{taskStats.pending}</Text>
                  <Text style={styles.statLabel}>Bekleyen</Text>
                </View>
                
                <View style={[styles.statCard, styles.dangerCard]}>
                  <Text style={styles.statNumber}>{taskStats.overdue}</Text>
                  <Text style={styles.statLabel}>Gecikmiş</Text>
                </View>
              </View>
            </View>

            {/* Hızlı Eylemler */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Hızlı Eylemler</Text>
              
              {renderQuickAction(
                'add-circle-outline',
                'Yeni Görev Ekle',
                'Hemen yeni bir görev oluştur',
                () => navigation.navigate('AddTask'),
                '#007AFF'
              )}
              
              {renderQuickAction(
                'checkmark-circle-outline',
                'Tamamlanan Görevler',
                `${taskStats.completed} tamamlanan görev`,
                () => navigation.navigate('CompletedTasks'),
                '#28A745'
              )}
              
              {taskStats.overdue > 0 && renderQuickAction(
                'warning-outline',
                'Gecikmiş Görevler',
                `${taskStats.overdue} görevin süresi geçmiş`,
                () => navigation.navigate('OverdueTasks'),
                '#FF3B30'
              )}
            </View>

            {/* Yaklaşan Görevler */}
            {recentTasks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Yaklaşan Görevler</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Ana Sayfa')}>
                    <Text style={[styles.seeAllText, { color: theme.primary }]}>Tümünü Gör</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.tasksContainer, { backgroundColor: theme.surface }]}>
                  <FlatList
                    data={recentTasks}
                    renderItem={renderTaskItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                </View>
              </View>
            )}

            {/* Motivasyon Mesajı */}
            <View style={[styles.motivationCard, { backgroundColor: theme.surface }]}>
              <Ionicons name="trophy-outline" size={32} color="#FFD700" />
              <Text style={[styles.motivationTitle, { color: theme.text }]}>
                {taskStats.completed === 0
                  ? 'İlk görevinizi tamamlamaya hazır mısınız?'
                  : taskStats.completed < 5
                  ? 'Harika gidiyorsunuz! Devam edin!'
                  : taskStats.completed < 10
                  ? 'Muhteşem! Gerçek bir görev kahramanısınız!'
                  : 'İnanılmaz! Productivity ustası oldunuz!'}
              </Text>
              <Text style={[styles.motivationText, { color: theme.textSecondary }]}>
                {taskStats.pending > 0
                  ? `${taskStats.pending} göreviniz daha var. Hepsini tamamlayabilirsiniz!`
                  : 'Tüm görevlerinizi tamamladınız! 🎉'}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: '#007AFF',
  },
  successCard: {
    backgroundColor: '#28A745',
  },
  warningCard: {
    backgroundColor: '#FFC107',
  },
  dangerCard: {
    backgroundColor: '#FF3B30',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  tasksContainer: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  taskItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  taskItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  overdueIndicator: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  taskItemDate: {
    fontSize: 14,
    marginLeft: 20,
  },
  overdueDate: {
    color: '#FF3B30',
  },
  motivationCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default TasksScreen; 