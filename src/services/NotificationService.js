import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bildirim davranışını ayarlayalım
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    // Sadece local notifications kullanıyoruz, push token gerekmez
  }

  // Bildirim izinlerini al (sadece local notifications)
  async requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'DoTime Bildirimleri',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
      }

      // Local notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Bildirim izni reddedildi');
        return false;
      }
      
      console.log('✅ Local bildirim izni verildi');
      return true;
    } catch (error) {
      console.error('Bildirim izni alınırken hata:', error);
      return false;
    }
  }

  // Anında bildirim gönder (test için)
  async sendImmediateNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
        },
        trigger: null, // Hemen gönder
      });
      
      console.log('Bildirim gönderildi:', title);
      return true;
    } catch (error) {
      console.error('Bildirim gönderilirken hata:', error);
      return false;
    }
  }

  // Zamanlanmış bildirim gönder - YENİ VE BASİT VERSİYON
  async scheduleNotification(title, body, triggerDate, data = {}) {
    try {
      // Güvenlik kontrolü: Geçmiş bir tarih için bildirim kurmayı engelle
      if (triggerDate < new Date()) {
        console.log(`🚨 HATA: Tetikleme tarihi (${triggerDate.toLocaleString('tr-TR')}) geçmişte. Bildirim iptal edildi.`);
        return null;
      }

      console.log(`✅ Bildirim zamanlanacak: "${title}"`);
      console.log(`   ⏰ Tetikleme zamanı: ${triggerDate.toLocaleString('tr-TR')}`);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: 'default',
        },
        // ANAHTAR DEĞİŞİKLİK: Saniye hesabı yok, direkt Date objesini veriyoruz.
        // Telefonun işletim sistemi en doğru zamanlamayı yapacak.
        trigger: triggerDate,
      });

      console.log(`👍 Bildirim başarıyla zamanlandı. ID: ${notificationId}`);
      return notificationId;

    } catch (error) {
      console.error('❌ Zamanlanmış bildirim oluşturulurken hata:', error);
      return null;
    }
  }

  // Kalan süreyi hesapla ve formatla
  formatTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    
    if (diffMs <= 0) {
      return 'Süre doldu!';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} gün ${diffHours % 24} saat kaldı`;
    } else if (diffHours > 0) {
      return `${diffHours} saat ${diffMinutes} dakika kaldı`;
    } else {
      return `${diffMinutes} dakika kaldı`;
    }
  }

  // Öncelik emojisi getir
  getPriorityEmoji(category) {
    switch (category) {
      case 'Urgent':
        return '🚨'; // Acil
      case 'Important':
        return '⭐'; // Önemli
      case 'Work':
        return '💼'; // İş
      case 'Personal':
        return '🏠'; // Kişisel
      default:
        return '📋'; // Normal
    }
  }

  // --- BİLDİRİM MANTIĞI YENİDEN YAZILDI ---
  // Önceki 'scheduleTaskReminder' ve 'scheduleMultipleReminders' fonksiyonları,
  // hataları gidermek için tek ve daha basit bir fonksiyonda birleştirildi.
  async scheduleMultipleReminders(task) {
    const taskDate = new Date(task.deadline);
    const now = new Date();
    const scheduledNotifications = [];
    let notificationSettings;

    try {
      const storedSettings = await AsyncStorage.getItem('notificationSettings');
      notificationSettings = storedSettings ? JSON.parse(storedSettings) : {
        enabled: true,
        tenMinutes: true,
        thirtyMinutes: false,
        oneHour: true,
        threeHours: false,
        twentyFourHours: false,
      };
    } catch (error) {
      console.error('Bildirim ayarları okunurken hata, varsayılanlar kullanılıyor:', error);
      // Hata durumunda en temel ayarları kullan
      notificationSettings = { enabled: true, tenMinutes: true, oneHour: true };
    }

    if (!notificationSettings.enabled) {
      console.log('Bildirimler kullanıcı tarafından kapatılmış, işlem durduruldu.');
      return [];
    }
    
    console.log('Kullanılan bildirim ayarları:', notificationSettings);

    const reminderTimes = [];
    if (notificationSettings.tenMinutes) reminderTimes.push({ minutes: 10, label: '10 dakika' });
    if (notificationSettings.thirtyMinutes) reminderTimes.push({ minutes: 30, label: '30 dakika' });
    if (notificationSettings.oneHour) reminderTimes.push({ minutes: 60, label: '1 saat' });
    if (notificationSettings.threeHours) reminderTimes.push({ minutes: 180, label: '3 saat' });
    if (notificationSettings.twentyFourHours) reminderTimes.push({ minutes: 1440, label: '24 saat' });

    console.log(`Toplam ${reminderTimes.length} farklı zaman için bildirim denenecek.`);

    for (const reminder of reminderTimes) {
      const reminderDate = new Date(taskDate.getTime() - (reminder.minutes * 60 * 1000));
      
      console.log(`[${reminder.label} için] Hesaplanan tetikleme tarihi: ${reminderDate.toLocaleString('tr-TR')}`);

      // Hesaplanan zamanın geçmişte olup olmadığını kontrol et
      if (reminderDate > now) {
        const priorityEmoji = this.getPriorityEmoji(task.category);
        const title = `${priorityEmoji} 🕥 ${task.title}`;
        const body = `Bu görevin tamamlanmasına yaklaşık ${reminder.label} kaldı.`;

        // Doğrudan ana bildirim fonksiyonunu çağır
        const notificationId = await this.scheduleNotification(
          title,
          body,
          reminderDate,
          {
            type: 'task_reminder',
            taskId: task.id,
          }
        );

        if (notificationId) {
          scheduledNotifications.push({ id: notificationId, label: reminder.label });
        }
      } else {
        console.log(`❌ [${reminder.label} için] Hatırlatma zamanı geçmişte. Atlanıyor.`);
      }
    }

    console.log(`✅ Başarıyla zamanlanan bildirim sayısı: ${scheduledNotifications.length}`);
    return scheduledNotifications;
  }

  // Görev için tüm bildirimleri iptal et
  async cancelTaskNotifications(taskId) {
    try {
      const allNotifications = await this.getAllScheduledNotifications();
      const taskNotifications = allNotifications.filter(
        notification => notification.content.data.taskId === taskId
      );
      
      for (const notification of taskNotifications) {
        await this.cancelNotification(notification.identifier);
      }
      
      console.log(`${taskNotifications.length} görev bildirimi iptal edildi`);
      return taskNotifications.length;
    } catch (error) {
      console.error('Görev bildirimleri iptal edilirken hata:', error);
      return 0;
    }
  }

  // Ödemeler için bildirimleri zamanla
  async schedulePaymentReminders(payment) {
    const paymentDate = new Date(payment.dueDate);
    const now = new Date();
    const scheduledNotifications = [];
    let notificationSettings;

    try {
      const storedSettings = await AsyncStorage.getItem('notificationSettings');
      // Ödemeler için farklı varsayılanlar kullanabiliriz, örn. daha uzun vadeli hatırlatmalar
      notificationSettings = storedSettings ? JSON.parse(storedSettings) : {
        enabled: true,
        tenMinutes: false,
        thirtyMinutes: false,
        oneHour: true,
        threeHours: false,
        twentyFourHours: true, // Varsayılan olarak 1 gün önce
      };
    } catch (error) {
      console.error('Bildirim ayarları okunurken hata, varsayılanlar kullanılıyor:', error);
      notificationSettings = { enabled: true, oneHour: true, twentyFourHours: true };
    }

    if (!notificationSettings.enabled) {
      console.log('Bildirimler kullanıcı tarafından kapatılmış, ödeme bildirimi kurulmayacak.');
      return [];
    }

    const reminderTimes = [
      { minutes: 60, label: '1 saat', setting: 'oneHour' },
      { minutes: 180, label: '3 saat', setting: 'threeHours' },
      { minutes: 1440, label: '24 saat', setting: 'twentyFourHours' },
    ].filter(rt => notificationSettings[rt.setting]);


    for (const reminder of reminderTimes) {
      const reminderDate = new Date(paymentDate.getTime() - (reminder.minutes * 60 * 1000));
      
      if (reminderDate > now) {
        const title = `💰 Yaklaşan Ödeme: ${payment.title}`;
        const body = `Bu ödemenin son gününe yaklaşık ${reminder.label} kaldı.`;

        const notificationId = await this.scheduleNotification(
          title,
          body,
          reminderDate,
          { type: 'payment_reminder', paymentId: payment.id }
        );

        if (notificationId) {
          scheduledNotifications.push({ id: notificationId, label: reminder.label });
        }
      }
    }
    console.log(`✅ ${scheduledNotifications.length} ödeme bildirimi başarıyla zamanlandı.`);
    return scheduledNotifications;
  }

  // Ödeme için tüm bildirimleri iptal et
  async cancelPaymentNotifications(paymentId) {
    try {
      const allNotifications = await this.getAllScheduledNotifications();
      const paymentNotifications = allNotifications.filter(
        notification => notification.content.data.paymentId === paymentId
      );
      
      for (const notification of paymentNotifications) {
        await this.cancelNotification(notification.identifier);
      }
      
      console.log(`💰 ${paymentNotifications.length} ödeme bildirimi iptal edildi (ID: ${paymentId})`);
      return paymentNotifications.length;
    } catch (error) {
      console.error('Ödeme bildirimleri iptal edilirken hata:', error);
      return 0;
    }
  }

  // Tüm zamanlanmış bildirimleri iptal et
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Tüm zamanlanmış bildirimler iptal edildi');
      return true;
    } catch (error) {
      console.error('Bildirimler iptal edilirken hata:', error);
      return false;
    }
  }

  // Belirli bir bildirimi iptal et
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Bildirim iptal edildi:', notificationId);
      return true;
    } catch (error) {
      console.error('Bildirim iptal edilirken hata:', error);
      return false;
    }
  }

  // Zamanlanmış bildirimleri listele
  async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Zamanlanmış bildirimler:', notifications);
      return notifications;
    } catch (error) {
      console.error('Zamanlanmış bildirimler alınırken hata:', error);
      return [];
    }
  }

  // Test bildirimi gönder
  async sendTestNotification() {
    const title = '🎉 DoTime Test Bildirimi';
    const body = 'Bildirimler başarıyla çalışıyor! 📱';
    
    return await this.sendImmediateNotification(title, body, {
      type: 'test',
      timestamp: new Date().toISOString(),
    });
  }

  // Bildirim listener'ları ekle
  addNotificationListeners() {
    // Bildirime tıklandığında
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
    });

    // Bildirime tıklandığında
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Bildirime tıklandı:', response);
      
      const data = response.notification.request.content.data;
      if (data.type === 'task_reminder' && data.taskId) {
        // Görev detay sayfasına yönlendir
        console.log('Görev detayına yönlendir:', data.taskId);
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  // Listener'ları temizle
  removeNotificationListeners(listeners) {
    if (listeners.notificationListener) {
      Notifications.removeNotificationSubscription(listeners.notificationListener);
    }
    if (listeners.responseListener) {
      Notifications.removeNotificationSubscription(listeners.responseListener);
    }
  }
}

// Singleton pattern
const notificationService = new NotificationService();
export default notificationService; 