import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomDateTimePicker from '../components/CustomDateTimePicker';
import AttachmentPreview from '../components/AttachmentPreview';
import notificationService from '../services/NotificationService';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddTaskScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [priority, setPriority] = useState('medium');

  const taskCategories = [
    { key: 'Urgent', label: 'Acil', icon: 'flame-outline', color: theme.danger },
    { key: 'Important', label: 'Önemli', icon: 'star-outline', color: theme.warning },
    { key: 'Work', label: 'İş', icon: 'briefcase-outline', color: theme.primary },
    { key: 'Personal', label: 'Kişisel', icon: 'person-outline', color: theme.success },
  ];

  const addTask = async (newTask) => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      const tasks = storedTasks ? JSON.parse(storedTasks) : [];
      
      const taskWithId = {
        ...newTask,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      
      tasks.push(taskWithId);
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Hata', 'Görev eklenirken bir hata oluştu');
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

  const handleAddTask = async () => {
    if (title.trim() === '') {
      Alert.alert('Uyarı', 'Lütfen bir başlık girin.');
      return;
    }
    const newTask = {
      title,
      description,
      deadline: deadline.toISOString(),
      priority,
      category,
      completed: false,
    };
    await addTask(newTask);
    Alert.alert('Başarılı', 'Yeni görev eklendi!', [
      { text: 'Tamam', onPress: () => navigation.goBack() }
    ]);
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

  const styles = getStyles(theme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Başlık</Text>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Görev başlığını girin..."
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Açıklama</Text>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Açıklama ekleyin..."
              placeholderTextColor={theme.textSecondary}
              multiline
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.categoryContainer}>
            {taskCategories.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: category === item.key ? item.color : theme.surface,
                    borderColor: category === item.key ? item.color : theme.border,
                  },
                ]}
                onPress={() => setCategory(item.key)}
              >
                <Ionicons
                  name={item.icon}
                  size={30}
                  color={category === item.key ? '#FFF' : item.color}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    { color: category === item.key ? '#FFF' : theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Son Tarih ve Saat</Text>
          <View style={styles.deadlineContainer}>
            <Ionicons name="calendar" size={30} color={theme.primary} />
            <View style={styles.deadlineTextContainer}>
              <Text style={[styles.deadlineDate, { color: theme.text }]}>{formatDate(deadline)}</Text>
              <Text style={[styles.deadlineTime, { color: theme.textSecondary }]}>{formatTime(deadline)}</Text>
            </View>
          </View>
          <View style={styles.dateButtonsContainer}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={20} color={'#fff'} />
              <Text style={styles.dateButtonText}>Tarih Seç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time" size={20} color={'#fff'} />
              <Text style={styles.dateButtonText}>Saat Seç</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CustomDateTimePicker
          isVisible={showDatePicker}
          mode="date"
          value={deadline}
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
        />
        <CustomDateTimePicker
          isVisible={showTimePicker}
          mode="time"
          value={deadline}
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
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleAddTask}>
          <Text style={styles.saveButtonText}>Görevi Kaydet</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
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
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deadlineTextContainer: {
    marginLeft: 15,
  },
  deadlineDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  deadlineTime: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  dateButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: theme.primary,
    marginRight: 5,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: theme.success,
    marginLeft: 5,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.background,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: theme.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
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

export default AddTaskScreen; 