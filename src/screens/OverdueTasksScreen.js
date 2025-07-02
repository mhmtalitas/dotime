import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OverdueTasksScreen = () => {
  const { theme } = useTheme();
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadOverdueTasks();
    }, [])
  );

  const loadOverdueTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        if (Array.isArray(parsedTasks)) {
          const now = new Date();
          const overdue = parsedTasks
            .filter(task => task && !task.completed && new Date(task.deadline) < now)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
          setOverdueTasks(overdue);
          groupTasksByDate(overdue);
        }
      }
    } catch (error) {
      console.error('Error loading overdue tasks:', error);
    }
  };

  const groupTasksByDate = (tasks) => {
    const groups = tasks.reduce((acc, task) => {
      const date = new Date(task.deadline).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(task);
      return acc;
    }, {});

    const sections = Object.keys(groups).map(title => ({
      title,
      data: groups[title]
    }));
    setGroupedTasks(sections);
  };

  const handleDelete = async (taskId) => {
    Alert.alert(
      'Görevi Sil',
      'Bu görevi kalıcı olarak silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedTasks = await AsyncStorage.getItem('tasks');
              const tasks = storedTasks ? JSON.parse(storedTasks) : [];
              const updatedTasks = tasks.filter(task => task.id !== taskId);
              await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
              loadOverdueTasks();
            } catch (error) {
              Alert.alert('Hata', 'Görev silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };
  
  const getCategoryStyle = (category) => {
    switch (category) {
      case 'Urgent': return { text: 'Acil', color: '#FF3B30', icon: 'flash-outline' };
      case 'Important': return { text: 'Önemli', color: '#007AFF', icon: 'alert-circle-outline' };
      case 'Work': return { text: 'İş', color: '#6F42C1', icon: 'briefcase-outline' };
      case 'Personal': return { text: 'Kişisel', color: '#28A745', icon: 'person-outline' };
      default: return { text: 'Normal', color: '#6C757D', icon: 'radio-button-off-outline' };
    }
  };

  const renderTaskCard = ({ item }) => {
    const categoryStyle = getCategoryStyle(item.category);
    const now = new Date();
    const deadline = new Date(item.deadline);
    const daysOverdue = Math.floor((now - deadline) / (1000 * 60 * 60 * 24));

    return (
        <View style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.danger, borderWidth: 1 }]}>
            <View style={styles.taskHeader}>
                <View style={styles.categoryBadge}>
                    <Ionicons name={categoryStyle.icon} size={16} color={categoryStyle.color} />
                    <Text style={[styles.categoryText, { color: categoryStyle.color }]}>{categoryStyle.text}</Text>
                </View>
                <Text style={[styles.overdueText, { color: theme.danger }]}>
                    {daysOverdue > 0 ? `${daysOverdue} gün geçti` : 'Bugün son'}
                </Text>
            </View>
            <Text style={[styles.taskTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.taskDescription, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.danger + '20' }]}
                    onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    <Text style={[styles.actionButtonText, { color: theme.danger }]}>Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      {overdueTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Gecikmiş göreviniz yok</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Tüm görevleriniz zamanında. Harika iş!
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupedTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTaskCard}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionHeader, { color: theme.text }]}>{title}</Text>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  listContainer: { paddingBottom: 32, paddingTop: 16 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryText: { fontSize: 12, fontWeight: '600' },
  overdueText: { fontSize: 12, fontWeight: 'bold' },
  taskTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  taskDescription: { fontSize: 14, marginBottom: 12 },
  actionButtons: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 4 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flex: 1, justifyContent: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center' },
});

export default OverdueTasksScreen; 