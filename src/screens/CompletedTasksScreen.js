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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CompletedTasksScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [completedTasks, setCompletedTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadCompletedTasks();
    }, [])
  );

  const loadCompletedTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        if (Array.isArray(parsedTasks)) {
          const completed = parsedTasks
            .filter(task => task && task.completed)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
          setCompletedTasks(completed);
          groupTasksByDate(completed);
        }
      }
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    }
  };

  const groupTasksByDate = (tasks) => {
    const groups = tasks.reduce((acc, task) => {
      const date = new Date(task.completedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
      const today = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

      let title = date;
      if (date === today) title = 'Bugün';
      else if (date === yesterday) title = 'Dün';

      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(task);
      return acc;
    }, {});

    const sections = Object.keys(groups).map(title => ({
      title,
      data: groups[title]
    }));
    setGroupedTasks(sections);
  };

  const handleUndoComplete = async (taskToUndo) => {
     try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      const tasks = storedTasks ? JSON.parse(storedTasks) : [];
      const updatedTasks = tasks.map(task =>
        task.id === taskToUndo.id ? { ...task, completed: false, completedAt: null } : task
      );
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      loadCompletedTasks();
    } catch (error) {
      Alert.alert('Hata', 'Görev geri alınırken bir hata oluştu.');
    }
  };
  
  const handleDelete = async (taskId) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      const tasks = storedTasks ? JSON.parse(storedTasks) : [];
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      loadCompletedTasks();
    } catch (error) {
      Alert.alert('Hata', 'Görev silinirken bir hata oluştu.');
    }
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      'Tümünü Sil',
      'Tüm tamamlanan görevleri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Tümünü Sil', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const storedTasks = await AsyncStorage.getItem('tasks');
              const tasks = storedTasks ? JSON.parse(storedTasks) : [];
              const remainingTasks = tasks.filter(task => !task.completed);
              await AsyncStorage.setItem('tasks', JSON.stringify(remainingTasks));
              loadCompletedTasks();
            } catch (error) {
              Alert.alert('Hata', 'Görevler silinirken bir hata oluştu');
            }
          }
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
    return (
      <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}>
        <View style={[styles.taskCard, { backgroundColor: theme.surface }]}>
            <View style={styles.taskHeader}>
                <View style={styles.categoryBadge}>
                    <Ionicons name={categoryStyle.icon} size={16} color={categoryStyle.color} />
                    <Text style={[styles.categoryText, { color: categoryStyle.color }]}>{categoryStyle.text}</Text>
                </View>
                <Text style={[styles.completedTime, { color: theme.textSecondary }]}>
                {new Date(item.completedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <Text style={[styles.taskTitle, { color: theme.textSecondary, textDecorationLine: 'line-through' }]}>{item.title}</Text>
            <Text style={[styles.taskDescription, { color: theme.textSecondary }]} numberOfLines={1}>{item.description}</Text>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                    onPress={() => handleUndoComplete(item)}>
                    <Ionicons name="arrow-undo-outline" size={16} color={theme.primary} />
                    <Text style={[styles.actionButtonText, { color: theme.primary }]}>Geri Yükle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.danger + '20' }]}
                    onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={16} color={theme.danger} />
                    <Text style={[styles.actionButtonText, { color: theme.danger }]}>Sil</Text>
                </TouchableOpacity>
            </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const dailyAverage = (groupedTasks.length > 0) 
    ? (completedTasks.length / groupedTasks.length).toFixed(1) 
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />
      {completedTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz tamamlanan görev yok</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Bir görevi tamamladığınızda burada listelenir.
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
          ListHeaderComponent={() => (
              <View style={styles.deleteAllContainer}>
                {completedTasks.length > 0 && (
                  <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllButton}>
                    <Text style={styles.deleteAllButtonText}>Tümünü Sil</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  deleteAllContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  deleteAllButton: { backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  deleteAllButtonText: { color: 'white', fontWeight: 'bold' },
  listContainer: { paddingBottom: 32 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
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
  completedTime: { fontSize: 12 },
  taskTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  taskDescription: { fontSize: 14, marginBottom: 12 },
  actionButtons: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 4 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flex: 1, justifyContent: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center' },
});

export default CompletedTasksScreen; 