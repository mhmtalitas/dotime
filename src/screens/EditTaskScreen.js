import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import CustomDateTimePicker from '../components/CustomDateTimePicker';
import AttachmentPreview from '../components/AttachmentPreview';
import notificationService from '../services/NotificationService';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditTaskScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { task: routeTask, taskId } = route.params;
  const { theme } = useTheme();
  
  const [task, setTask] = useState(routeTask || null);
  const [loading, setLoading] = useState(!routeTask);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const loadTask = async () => {
      if (routeTask) {
        // Eğer task objesi direkt geldiyse
        setTask(routeTask);
        setTitle(routeTask.title || '');
        setDescription(routeTask.description || '');
        setCategory(routeTask.category || 'Work');
        setDeadline(new Date(routeTask.deadline || new Date()));
        setAttachments(routeTask.attachments || []);
        setLoading(false);
      } else if (taskId) {
        // Eğer sadece taskId geldiyse, görevi yükle
        try {
          const storedTasks = await AsyncStorage.getItem('tasks');
          if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            const foundTask = parsedTasks.find(t => t.id === taskId);
            if (foundTask) {
              setTask(foundTask);
              setTitle(foundTask.title || '');
              setDescription(foundTask.description || '');
              setCategory(foundTask.category || 'Work');
              setDeadline(new Date(foundTask.deadline || new Date()));
              setAttachments(foundTask.attachments || []);
            }
          }
        } catch (error) {
          console.error('Görev yüklenirken hata:', error);
        }
        setLoading(false);
      }
    };

    loadTask();
  }, [routeTask, taskId]);

  const taskCategories = [
    { key: 'Urgent', label: 'Acil', icon: 'flame-outline', color: '#FF3B30' },
    { key: 'Important', label: 'Önemli', icon: 'star-outline', color: '#007AFF' },
    { key: 'Work', label: 'İş', icon: 'briefcase-outline', color: '#AF52DE' },
    { key: 'Personal', label: 'Kişisel', icon: 'person-outline', color: '#34C759' },
  ];

  const updateTask = async (updatedTask) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        const updatedTasks = parsedTasks.map(t => 
          t.id === updatedTask.id ? updatedTask : t
        );
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const newAttachment = {
          id: Date.now().toString(),
          name: file.name,
          uri: file.uri,
          type: 'document',
          size: file.size,
        };
        setAttachments([...attachments, newAttachment]);
        Alert.alert('✅ Başarılı!', `"${file.name}" dosyası eklendi.`);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu: ' + error.message);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri izni gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const newAttachment = {
          id: Date.now().toString(),
          name: `Fotoğraf_${Date.now()}.jpg`,
          uri: result.assets[0].uri,
          type: 'image',
        };
        setAttachments([...attachments, newAttachment]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const removeAttachment = (id) => {
    setAttachments(attachments.filter(att => att.id !== id));
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Ek Dosya Seç',
      'Hangi türde dosya eklemek istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Fotoğraf', onPress: pickImage },
        { text: 'Belge', onPress: pickDocument },
      ]
    );
  };

  const handleDateConfirm = (selectedDate) => {
    const newDeadline = new Date(deadline);
    newDeadline.setFullYear(selectedDate.getFullYear());
    newDeadline.setMonth(selectedDate.getMonth());
    newDeadline.setDate(selectedDate.getDate());
    setDeadline(newDeadline);
    setShowDatePicker(false);
  };

  const handleTimeConfirm = (selectedTime) => {
    const newDeadline = new Date(deadline);
    newDeadline.setHours(selectedTime.getHours());
    newDeadline.setMinutes(selectedTime.getMinutes());
    newDeadline.setSeconds(0);
    newDeadline.setMilliseconds(0);
    setDeadline(newDeadline);
    setShowTimePicker(false);
  };

  const handleUpdateTask = async () => {
    if (title.trim() === '') {
      Alert.alert('Uyarı', 'Lütfen görev başlığını girin');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Uyarı', 'Lütfen görev açıklamasını girin');
      return;
    }

    try {
      const updatedTask = {
        ...task,
        title,
        description,
        category,
        deadline: deadline.toISOString(),
        attachments,
        updatedAt: new Date().toISOString(),
      };

      await updateTask(updatedTask);
      
      // Eski bildirimleri iptal et ve yeni bildirimler zamanla
      try {
        await notificationService.cancelTaskNotifications(task.id);
        await notificationService.requestPermissions();
        const scheduledNotifications = await notificationService.scheduleMultipleReminders(updatedTask);
        console.log(`${scheduledNotifications.length} yeni bildirim zamanlandı`);
      } catch (notificationError) {
        console.error('Bildirim güncellenirken hata:', notificationError);
      }
      
      Alert.alert('Başarılı', 'Görev ve hatırlatmalar güncellendi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Görev güncellenirken bir hata oluştu');
    }
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Yarın';
    } else {
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      padding: 20,
      flexGrow: 1,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 10,
      color: theme.text,
    },
    inputContainer: {
      marginBottom: 20,
    },
    textInputWrapper: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    input: {
      padding: 16,
      fontSize: 16,
      color: theme.text,
    },
    descriptionInput: {
      height: 120,
      textAlignVertical: 'top',
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    categoryButton: {
      width: '48%',
      aspectRatio: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 15,
      borderWidth: 1.5,
      marginBottom: 10,
      padding: 5,
    },
    categoryButtonText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
    dateTimeDisplay: {
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    dateTimeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateTimeTexts: {
      marginLeft: 16,
      alignItems: 'center',
    },
    dateText: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
      color: theme.text,
    },
    timeText: {
      fontSize: 18,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    dateTimeButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 8,
    },
    dateButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: theme.primary,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    saveButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    attachmentButton: {
      borderRadius: 8,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      marginBottom: 10,
    },
    attachmentButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 16 }}>Görev yükleniyor...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, fontSize: 16 }}>Görev bulunamadı</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: theme.primary, borderRadius: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: 'white' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Başlık</Text>
          <View style={[styles.textInputWrapper]}>
            <TextInput
              style={styles.input}
              placeholder="Görev başlığını girin..."
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Açıklama</Text>
          <View style={[styles.textInputWrapper]}>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Açıklama ekleyin..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        </View>

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.categoryContainer}>
          {taskCategories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setCategory(cat.key)}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: category === cat.key ? cat.color : theme.surface,
                  borderColor: category === cat.key ? cat.color : theme.border,
                }
              ]}
            >
              <Ionicons 
                name={cat.icon}
                size={30} 
                color={category === cat.key ? 'white' : theme.textSecondary}
              />
              <Text style={{
                ...styles.categoryButtonText,
                color: category === cat.key ? 'white' : theme.textSecondary,
              }}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Son Tarih ve Saat</Text>
          <View style={[styles.dateTimeDisplay]}>
            <View style={styles.dateTimeInfo}>
              <Ionicons name="calendar" size={24} color={theme.primary} />
              <View style={styles.dateTimeTexts}>
                <Text style={styles.dateText}>{formatDate(deadline)}</Text>
                <Text style={styles.timeText}>{formatTime(deadline)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.dateTimeButtons}>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text style={styles.dateButtonText}>Tarih Seç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: theme.success }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="white" />
              <Text style={styles.dateButtonText}>Saat Seç</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <CustomDateTimePicker
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
        />
        <CustomDateTimePicker
          isVisible={showTimePicker}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={() => setShowTimePicker(false)}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ek Dosyalar</Text>
          <AttachmentPreview
            attachments={attachments}
            onRemove={(file) => setAttachments(attachments.filter(a => a.uri !== file.uri))}
          />
          <TouchableOpacity style={styles.attachmentButton} onPress={pickDocument}>
            <Ionicons name="attach-outline" size={20} color={theme.text} />
            <Text style={styles.attachmentButtonText}>Dosya Ekle</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateTask}>
          <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditTaskScreen; 