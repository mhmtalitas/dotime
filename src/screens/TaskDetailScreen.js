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
  const styles = getStyles(theme);
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
    <View style={styles.container}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.category) }]}>
            <Text style={styles.priorityText}>{getPriorityText(task.category)}</Text>
          </View>
          
          <View style={[styles.timeRemainingBadge, { backgroundColor: isOverdue() ? theme.danger : theme.primary + '30' }]}>
            <Text style={[styles.timeRemainingText, { color: isOverdue() ? '#fff' : theme.primary }]}>
              {getTimeRemaining()}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{task.title}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Açıklama</Text>
            <Text style={styles.description}>{task.description || 'Açıklama yok'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Son Tarih</Text>
            <View style={styles.deadlineInfo}>
              <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
              <Text style={styles.deadlineText}>{formatDateTime(task.deadline)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Görev Bilgileri</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Oluşturma Tarihi:</Text>
                <Text style={styles.infoValue}>{new Date(task.createdAt).toLocaleDateString('tr-TR')}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Durum:</Text>
                <Text style={[styles.infoValue, { color: task.completed ? theme.success : theme.warning, fontWeight: 'bold' }]}>
                  {task.completed ? 'Tamamlandı' : 'Devam Ediyor'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
          <Text style={[styles.deleteButtonText]}>Görevi Sil</Text>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary + '30' }]} onPress={() => navigation.navigate('EditTask', { taskId: task.id })}>
            <Ionicons name="pencil-outline" size={20} color={theme.primary} />
            <Text style={[styles.actionButtonText, { color: theme.primary }]}>Düzenle</Text>
          </TouchableOpacity>
          {!task.completed && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={confirmComplete}>
              <Ionicons name="checkmark-done-outline" size={20} color={'#fff'} />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>Tamamla</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120, // footer için boşluk
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  priorityBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  priorityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeRemainingBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  timeRemainingText: {
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.text,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: theme.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.textSecondary,
  },
  deadlineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 16,
    marginLeft: 8,
    color: theme.textSecondary,
  },
  infoBox: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: theme.danger + '20',
    marginBottom: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.danger,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TaskDetailScreen; 