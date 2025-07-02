import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AttachmentPreview from '../components/AttachmentPreview';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TaskDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { task: routeTask, taskId } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [task, setTask] = useState(routeTask);
  const [loading, setLoading] = useState(!routeTask && !!taskId);

  useEffect(() => {
    if (taskId && !routeTask) {
      loadTaskById(taskId);
    }
  }, [taskId, routeTask]);

  // Sayfa odaklandığında görevi yeniden yükle
  useEffect(() => {
    if (isFocused && task) {
      loadTaskById(task.id);
    }
  }, [isFocused]);

  const loadTaskById = async (id) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        const foundTask = parsedTasks.find(t => t.id === id);
        if (foundTask) {
          setTask(foundTask);
        }
      }
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmComplete = () => {
    Alert.alert(
      'Görevi Tamamla',
      `"${task.title}" görevini tamamladınız mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Tamamla', onPress: handleComplete },
      ]
    );
  };

  const handleComplete = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        const updatedTasks = parsedTasks.map(t => 
          t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        Alert.alert('Başarılı', 'Görev tamamlandı!', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Hata', 'Görev tamamlanırken bir hata oluştu');
    }
  };
  
  const handleDelete = () => {
    Alert.alert(
      "Görevi Sil",
      `"${task.title}" görevini kalıcı olarak silmek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          onPress: async () => {
            try {
              const storedTasks = await AsyncStorage.getItem('tasks');
              if (storedTasks) {
                const parsedTasks = JSON.parse(storedTasks);
                const filteredTasks = parsedTasks.filter(t => t.id !== task.id);
                await AsyncStorage.setItem('tasks', JSON.stringify(filteredTasks));
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Hata', 'Görev silinirken bir hata oluştu');
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Görev yükleniyor...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Görev bulunamadı</Text>
      </View>
    );
  }

  const getPriorityColor = (category) => {
    switch (category) {
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

  const getPriorityText = (category) => {
    switch (category) {
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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateText;
    if (date.toDateString() === today.toDateString()) {
      dateText = 'Bugün';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateText = 'Yarın';
    } else {
      dateText = date.toLocaleDateString('tr-TR');
    }

    const timeText = date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `${dateText}, ${timeText}`;
  };

  const openAttachment = async (attachment) => {
    if (attachment.type === 'image') {
      // Fotoğraf önizleme için ayrı modal açabiliriz
      Alert.alert('Fotoğraf', 'Fotoğraf görüntüleyici burada açılacak');
    } else {
      try {
        const canOpen = await Linking.canOpenURL(attachment.uri);
        if (canOpen) {
          await Linking.openURL(attachment.uri);
        } else {
          Alert.alert('Hata', 'Dosya açılamıyor');
        }
      } catch (error) {
        Alert.alert('Hata', 'Dosya açılırken bir hata oluştu');
      }
    }
  };

  const isOverdue = () => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    return deadline < now && !task.completed;
  };

  const getTimeRemaining = () => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffTime = deadline - now;
    
    if (diffTime < 0) {
      return 'Süresi geçmiş';
    }
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} gün ${hours} saat kaldı`;
    } else if (hours > 0) {
      return `${hours} saat ${minutes} dakika kaldı`;
    } else {
      return `${minutes} dakika kaldı`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.background}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 10 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { 
          backgroundColor: theme.background,
          borderBottomColor: theme.border 
        }]}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.category) }]}>
            <Text style={styles.priorityText}>{getPriorityText(task.category)}</Text>
          </View>
          
          <View style={[
            styles.timeRemaining, 
            { backgroundColor: isOverdue() ? theme.danger + '20' : theme.primary + '20' }
          ]}>
            <Text style={[
              styles.timeText, 
              { color: isOverdue() ? theme.danger : theme.primary }
            ]}>
              {getTimeRemaining()}
            </Text>
          </View>
        </View>

                <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{task.title}</Text>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Açıklama</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {task.description || 'Açıklama eklenmemiş'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Son Tarih</Text>
            <View style={styles.deadlineContainer}>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={[styles.deadline, { color: theme.textSecondary }]}>
                {formatDateTime(task.deadline)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Görev Bilgileri</Text>
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Oluşturma Tarihi:</Text>
                <Text style={styles.infoValue}>
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString('tr-TR') : '01.07.2025'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Durum:</Text>
                <Text style={styles.infoValue}>Devam Ediyor</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      {!task.completed && (
        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.top + 10 }]}>
          <TouchableOpacity style={[styles.button, styles.editButton, {backgroundColor: theme.primary + '20'}]} onPress={() => navigation.navigate('EditTask', { task })}>
            <Ionicons name="pencil-outline" size={20} color={theme.primary} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.completeButton]} onPress={confirmComplete}>
            <Ionicons name="checkmark-done-outline" size={20} color={'#fff'} />
            <Text style={[styles.buttonText, { color: '#fff' }]}>Tamamla</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.deleteButton, { bottom: (!task.completed ? 85 : 0) + insets.top + 10, backgroundColor: theme.danger + '20' }]}
        onPress={handleDelete}
      >
        <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Görevi Sil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeRemaining: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadline: {
    fontSize: 16,
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButton: {},
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  editButtonText: {
    color: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#007AFF',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskDetailScreen; 