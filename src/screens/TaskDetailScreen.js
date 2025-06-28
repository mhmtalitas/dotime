import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AttachmentPreview from '../components/AttachmentPreview';
import { useTheme } from '../context/ThemeContext';

const TaskDetailScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [currentTask, setCurrentTask] = useState(task);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

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

  const markAsCompleted = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.map(t => 
          t.id === currentTask.id 
            ? { ...t, completed: true, completedAt: new Date().toISOString() }
            : t
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        
        Alert.alert('Başarılı', 'Görev tamamlandı!', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Görev tamamlanırken bir hata oluştu');
    }
  };

  const deleteTask = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        const updatedTasks = tasks.filter(t => t.id !== currentTask.id);
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
        
        Alert.alert('Başarılı', 'Görev silindi!', [
          { text: 'Tamam', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Görev silinirken bir hata oluştu');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Görevi Sil',
      'Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: deleteTask },
      ]
    );
  };

  const confirmComplete = () => {
    Alert.alert(
      'Görevi Tamamla',
      `"${currentTask.title}" görevini tamamladınız mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Tamamla', onPress: markAsCompleted },
      ]
    );
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
    const deadline = new Date(currentTask.deadline);
    const now = new Date();
    return deadline < now;
  };

  const getTimeRemaining = () => {
    const deadline = new Date(currentTask.deadline);
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
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(currentTask.category) }]}>
          <Text style={styles.priorityText}>{getPriorityText(currentTask.category)}</Text>
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
          <Text style={[styles.title, { color: theme.text }]}>{currentTask.title}</Text>
        
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Açıklama</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{currentTask.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Son Tarih</Text>
          <View style={[styles.dateContainer, { 
            backgroundColor: theme.surface,
            borderColor: theme.border 
          }]}>
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formatDateTime(currentTask.deadline)}
            </Text>
          </View>
        </View>

        <AttachmentPreview 
          attachments={currentTask.attachments}
          onRemove={() => {}} // Read-only mode
          editable={false}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Görev Bilgileri</Text>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Oluşturma Tarihi:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(currentTask.createdAt).toLocaleDateString('tr-TR')}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Durum:</Text>
            <Text style={[styles.infoValue, { color: currentTask.completed ? theme.success : theme.primary }]}>
              {currentTask.completed ? 'Tamamlandı' : 'Devam Ediyor'}
            </Text>
        </View>
      </View>

          {/* Action Buttons - ScrollView içinde */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
              style={[styles.actionButton, styles.editButton, { 
                backgroundColor: theme.surface,
                borderColor: theme.primary 
              }]}
              onPress={() => navigation.navigate('EditTask', { task: currentTask })}
        >
              <Ionicons name="create-outline" size={20} color={theme.primary} />
              <Text style={[styles.editButtonText, { color: theme.primary, marginLeft: 8 }]}>Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity
              style={[styles.actionButton, styles.completeButton, { backgroundColor: theme.primary }]}
          onPress={confirmComplete}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={[styles.completeButtonText, { marginLeft: 8 }]}>Tamamla</Text>
        </TouchableOpacity>
      </View>

          <TouchableOpacity 
            style={[styles.deleteButton, { backgroundColor: theme.danger }]} 
            onPress={confirmDelete}
          >
        <Text style={styles.deleteButtonText}>Görevi Sil</Text>
      </TouchableOpacity>
        </View>
    </ScrollView>
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
    padding: 20,
    borderBottomWidth: 1,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  timeRemaining: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  overdue: {
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  overdueText: {
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  editButton: {
    borderWidth: 2,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskDetailScreen; 