import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TaskSummaryScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [tasks, setTasks] = useState([]);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

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
          setTasks(parsedTasks);
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

  const getTaskStats = () => {
    const now = new Date();
    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
    const overdueTasks = activeTasks.filter(task => new Date(task.deadline) < now);
    const pendingTasks = activeTasks.filter(task => new Date(task.deadline) >= now);
    
    return {
      total: tasks.length,
      completed: completedTasks.length,
      pending: pendingTasks.length,
      overdue: overdueTasks.length
    };
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    return tasks
      .filter(task => !task.completed)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    }
    
    return date.toLocaleDateString('tr-TR');
  };

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const stats = getTaskStats();
  const upcomingTasks = getUpcomingTasks();

  const SummaryCard = ({ title, value, color, onPress }) => (
    <TouchableOpacity style={[styles.summaryCard, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickActionItem = ({ icon, title, subtitle, onPress, iconColor, backgroundColor }) => (
    <TouchableOpacity style={[styles.quickActionItem, { backgroundColor }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.quickActionText}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const TaskItem = ({ task }) => {
    const isTaskOverdue = isOverdue(task.deadline);
    const categoryColor = isTaskOverdue ? theme.danger : '#007AFF'; // Overdue: red, Upcoming: blue

    return (
      <TouchableOpacity 
        style={[styles.taskItem, { borderLeftColor: categoryColor }]} 
        onPress={() => navigation.navigate('TaskDetail', { task })}
      >
        <View style={styles.taskItemDetails}>
          <Text style={[styles.taskItemTitle, { color: theme.text }]}>{task.title}</Text>
          <Text style={[styles.taskItemDate, { color: theme.textSecondary }]}>{formatDate(task.deadline)}</Text>
        </View>
        
        {isTaskOverdue && (
          <View style={styles.overdueTag}>
            <Text style={styles.overdueText}>GECİKMİŞ</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.background}
        translucent={false}
      />
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Görev Özeti</Text>
      
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          title="Toplam Görev"
          value={stats.total}
          color="#007AFF"
          onPress={() => navigation.navigate('Tasks')}
        />
        
        <SummaryCard
          title="Tamamlanan"
          value={stats.completed}
          color="#28A745"
          onPress={() => navigation.navigate('CompletedTasks')}
        />
        
        <SummaryCard
          title="Bekleyen"
          value={stats.pending}
          color="#FF9500"
          onPress={() => navigation.navigate('Tasks')}
        />
        
        <SummaryCard
          title="Gecikmiş"
          value={stats.overdue}
          color="#FF3B30"
          onPress={() => navigation.navigate('OverdueTasks')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Hızlı Eylemler</Text>
        
        <QuickActionItem
          icon="add-circle"
          title="Yeni Görev Ekle"
          subtitle="Hemen yeni bir görev oluştur"
          onPress={() => navigation.navigate('AddTask')}
          iconColor="#007AFF"
          backgroundColor={theme.surface}
        />
        
        <QuickActionItem
          icon="checkmark-circle"
          title="Tamamlanan Görevler"
          subtitle={`${stats.completed} tamamlanan görev`}
          onPress={() => navigation.navigate('CompletedTasks')}
          iconColor="#28A745"
          backgroundColor={theme.surface}
        />
        
        <QuickActionItem
          icon="alert-circle"
          title="Gecikmiş Görevler"
          subtitle={`${stats.overdue} görevin süresi geçmiş`}
          onPress={() => navigation.navigate('OverdueTasks')}
          iconColor="#FF3B30"
          backgroundColor={theme.surface}
        />
      </View>

      {/* Upcoming Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Yaklaşan Görevler</Text>
          {upcomingTasks.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>Tümünü Gör</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {upcomingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Yaklaşan görev bulunmuyor
            </Text>
          </View>
        ) : (
          upcomingTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
                 )}
       </View>
     </ScrollView>
   </SafeAreaView>
   );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  taskItem: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 5,
  },
  taskItemDetails: {
    flex: 1,
    marginRight: 10,
  },
  taskItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskItemDate: {
    fontSize: 14,
    marginTop: 4,
  },
  overdueTag: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default TaskSummaryScreen; 