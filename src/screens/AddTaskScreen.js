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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomDateTimePicker from '../components/CustomDateTimePicker';
import AttachmentPreview from '../components/AttachmentPreview';
import notificationService from '../services/NotificationService';
import { useTheme } from '../context/ThemeContext';

const AddTaskScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Important');
  const [deadline, setDeadline] = useState(() => {
    // Düzeltme: Başlangıç saatini mevcut lokal saate göre ayarla.
    // Ekstra dakika ekleme yok, saniyeler temizleniyor.
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const categories = [
    { key: 'Urgent', label: 'Acil', color: '#FF3B30' },
    { key: 'Important', label: 'Önemli', color: '#007AFF' },
    { key: 'Work', label: 'İş', color: '#6F42C1' },
    { key: 'Personal', label: 'Kişisel', color: '#28A745' },
  ];

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
    // Düzeltme: Saat dilimi sorununu önlemek için parçaları birleştir
    const newDeadline = new Date(deadline); // Önceki saat/dakika bilgisini koru
    newDeadline.setFullYear(selectedDate.getFullYear());
    newDeadline.setMonth(selectedDate.getMonth());
    newDeadline.setDate(selectedDate.getDate());
    setDeadline(newDeadline);
    setShowDatePicker(false); // Pencereyi kapat
  };

  const handleTimeConfirm = (selectedTime) => {
    // Düzeltme: Saat dilimi sorununu önlemek için parçaları birleştir
    const newDeadline = new Date(deadline); // Önceki tarih bilgisini koru
    newDeadline.setHours(selectedTime.getHours());
    newDeadline.setMinutes(selectedTime.getMinutes());
    newDeadline.setSeconds(0); // Saniyeleri sıfırla
    newDeadline.setMilliseconds(0); // Milisaniyeleri sıfırla

    setDeadline(newDeadline);
    setShowTimePicker(false); // Pencereyi kapat
  };

  const saveTask = async () => {
    if (!title.trim()) {
      Alert.alert('Uyarı', 'Lütfen görev başlığını girin');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Uyarı', 'Lütfen görev açıklamasını girin');
      return;
    }

    try {
      // Debug: Görev zamanını kontrol et
      const now = new Date();
      console.log('🕐 GÖREV KAYDETME DEBUG:');
      console.log('Şu anki zaman:', now.toLocaleString('tr-TR'));
      console.log('Görev bitiş zamanı:', deadline.toLocaleString('tr-TR'));
      console.log('Kalan süre (dakika):', Math.floor((deadline - now) / (1000 * 60)));
      
      const newTask = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        category,
        deadline: deadline.getTime(), // Lokal saatin timestamp'i, bu doğru
        attachments,
        completed: false,
        createdAt: new Date().getTime(),
      };

      const existingTasks = await AsyncStorage.getItem('tasks');
      const tasks = existingTasks ? JSON.parse(existingTasks) : [];
      tasks.push(newTask);
      
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));

      // Bildirim sistemini başlat ve çoklu hatırlatma zamanla
      let notificationMessage = '';
      try {
        await notificationService.requestPermissions();
        const scheduledNotifications = await notificationService.scheduleMultipleReminders(newTask);
        console.log(`${scheduledNotifications.length} bildirim zamanlandı`);
        
        if (scheduledNotifications.length > 0) {
          const reminderTimes = scheduledNotifications.map(n => n.label).join(', ');
          notificationMessage = `\n📅 Hatırlatmalar: ${reminderTimes} önce`;
        } else {
          notificationMessage = '\n⏰ Hatırlatma zamanı geçmiş, bildirim zamanlanmadı';
        }
      } catch (notificationError) {
        console.error('Bildirim zamanlanırken hata:', notificationError);
        notificationMessage = '\n⚠️ Bildirim ayarlanırken hata oluştu';
      }

      Alert.alert('Başarılı', `🎉 Görev başarıyla eklendi!${notificationMessage}`, [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Görev eklenirken bir hata oluştu');
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
      // Manuel tarih formatı, locale kullanma
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
  };

  const formatTime = (date) => {
    // Telefonun local saatini kullan, timezone dönüşümü yapma
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.background}
      />
      <ScrollView 
        style={[styles.scrollView, { paddingTop: insets.top + 15 }]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.form}>
        {/* Başlık */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Başlık</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border
            }]}
            placeholder="Görev başlığını girin"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Açıklama */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border
            }]}
            placeholder="Görev açıklamasını girin"
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Kategori */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Kategori</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: category === cat.key ? cat.color : theme.surface,
                    borderColor: category === cat.key ? cat.color : theme.border 
                  }
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={[
                  styles.categoryText,
                  { color: category === cat.key ? 'white' : theme.text }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tarih ve Saat Seçimi */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Son Tarih ve Saat</Text>
          
          {/* Seçilen Tarih ve Saat Gösterimi */}
          <View style={[styles.dateTimeDisplay, { 
            backgroundColor: theme.surface,
            borderColor: theme.border 
          }]}>
            <View style={styles.dateTimeInfo}>
              <Ionicons name="calendar" size={24} color={theme.primary} />
              <View style={styles.dateTimeTexts}>
                <Text style={[styles.dateText, { color: theme.text }]}>{formatDate(deadline)}</Text>
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>{formatTime(deadline)}</Text>
              </View>
            </View>
          </View>

          {/* Tarih ve Saat Seçim Butonları */}
          <View style={styles.dateTimeButtons}>
            <TouchableOpacity
              style={[styles.dateTimeButton, styles.dateButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text style={styles.dateTimeButtonText}>Tarih Seç</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dateTimeButton, styles.timeButton, { backgroundColor: theme.success }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="white" />
              <Text style={styles.dateTimeButtonText}>Saat Seç</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ek Dosyalar */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Ek Dosyalar</Text>
          <TouchableOpacity
            style={[styles.attachmentButton, { 
              backgroundColor: theme.surface,
              borderColor: theme.border 
            }]}
            onPress={showAttachmentOptions}
          >
            <Ionicons name="attach" size={20} color={theme.primary} />
            <Text style={[styles.attachmentButtonText, { color: theme.text }]}>Dosya Ekle</Text>
          </TouchableOpacity>

          <AttachmentPreview 
            attachments={attachments}
            onRemove={removeAttachment}
            editable={true}
          />
        </View>

        {/* Kaydet Butonu */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.success }]} 
          onPress={saveTask}
        >
          <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Görevi Kaydet</Text>
        </TouchableOpacity>
        </View>

      {/* Custom Date Picker */}
      <CustomDateTimePicker
        visible={showDatePicker}
        mode="date"
        is24Hour={true} // 24 saat formatını kullan
        initialDate={deadline}
        onClose={() => setShowDatePicker(false)}
        onConfirm={handleDateConfirm}
      />

      {/* Custom Time Picker */}
      <CustomDateTimePicker
        visible={showTimePicker}
        mode="time"
        is24Hour={true} // 24 saat formatını kullan
        initialDate={deadline}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimeConfirm}
      />
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
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateTimeDisplay: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  },
  timeText: {
    fontSize: 18,
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButton: {
  },
  timeButton: {
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  attachmentButton: {
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  attachmentButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },

  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AddTaskScreen; 