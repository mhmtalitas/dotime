import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  ScrollView,
  Linking,
  StatusBar,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import notificationService from '../services/NotificationService';


const SettingsScreen = ({ navigation }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    tenMinutes: true,
    thirtyMinutes: false,
    oneHour: true,
    threeHours: false,
    twentyFourHours: false,
  });

  const { theme, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem('notificationSettings');

      if (storedNotifications) {
        setNotificationSettings(JSON.parse(storedNotifications));
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setNotificationSettings(newSettings);
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi');
    }
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    Alert.alert('✅ Başarılı!', 'Koyu mod ' + (isDarkMode ? 'kapatıldı' : 'açıldı') + '! 🌙');
  };

  const clearAllData = () => {
    Alert.alert(
      'Tüm Verileri Sil',
      'Bu işlem tüm görevlerinizi ve ayarlarınızı silecek. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Başarılı', 'Tüm veriler silindi. Uygulama yeniden başlatılacak.', [
                { text: 'Tamam', onPress: () => {
                  // Uygulamayı yeniden başlatmak için navigation'ı reset edebiliriz
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                }}
              ]);
            } catch (error) {
              Alert.alert('Hata', 'Veriler silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const openURL = async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'URL açılamıyor');
      }
    } catch (error) {
      Alert.alert('Hata', 'URL açılırken bir hata oluştu');
    }
  };

  const exportData = async () => {
    try {
      // Tüm verileri topla
      const tasks = await AsyncStorage.getItem('tasks');
      const notificationSettings = await AsyncStorage.getItem('notificationSettings');
      const darkMode = await AsyncStorage.getItem('darkMode');
      
      const exportDataObj = {
        tasks: tasks ? JSON.parse(tasks) : [],
        notificationSettings: notificationSettings ? JSON.parse(notificationSettings) : null,
        darkMode: darkMode ? JSON.parse(darkMode) : false,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      // JSON string oluştur
      const jsonString = JSON.stringify(exportDataObj, null, 2);
      
      // Basit paylaşım - metin olarak
      try {
        await Share.share({
          message: `DoTime Yedek Verileri:\n\n${jsonString}`,
          title: 'DoTime Verilerini Dışa Aktar'
        });
        
        Alert.alert(
          '✅ Başarılı!', 
          `Verileriniz başarıyla dışa aktarıldı!\n\nToplam ${exportDataObj.tasks.length} görev dahil edildi.\n\nVerileri bir dosyaya kaydedip güvenli bir yerde saklayın.`
        );
      } catch (shareError) {
        // Paylaşım başarısız olursa, verileri göster
        Alert.alert(
          '📋 Verileriniz Hazır',
          'Aşağıdaki verileri kopyalayıp bir dosyaya kaydedin:',
          [
            { text: 'İptal', style: 'cancel' },
            { 
              text: 'Verileri Göster', 
              onPress: () => {
                Alert.alert(
                  'DoTime Yedek Verileri',
                  jsonString,
                  [{ text: 'Tamam' }],
                  { scrollViewProps: { style: { maxHeight: 400 } } }
                );
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Hata', 'Veriler dışa aktarılırken bir hata oluştu: ' + error.message);
    }
  };

  const importData = async () => {
    Alert.alert(
      'Veri İçe Aktarımı',
      'Yedek verilerinizi girmek için:',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Metin Gir',
          onPress: () => {
            Alert.prompt(
              'Yedek Verilerini Girin',
              'Daha önce dışa aktardığınız JSON verilerini buraya yapıştırın:',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'İçe Aktar',
                  onPress: async (inputText) => {
                    if (!inputText || inputText.trim() === '') {
                      Alert.alert('Hata', 'Lütfen geçerli yedek verilerini girin!');
                      return;
                    }

                    try {
                      const importedData = JSON.parse(inputText.trim());

                      // Veri formatını doğrula
                      if (!importedData.version || !importedData.tasks) {
                        Alert.alert('Hata', 'Geçersiz yedek dosyası formatı!');
                        return;
                      }

                      // Onay al
                      Alert.alert(
                        'Veri İçe Aktarımı Onayı',
                        `${importedData.tasks.length} görev içeren yedek veriler bulundu.\n\nMevcut verileriniz değiştirilecek.\n\nDevam etmek istiyor musunuz?`,
                        [
                          { text: 'İptal', style: 'cancel' },
                          {
                            text: 'Evet, Geri Yükle',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                // Verileri geri yükle
                                await AsyncStorage.setItem('tasks', JSON.stringify(importedData.tasks));
                                
                                if (importedData.notificationSettings) {
                                  await AsyncStorage.setItem('notificationSettings', JSON.stringify(importedData.notificationSettings));
                                  setNotificationSettings(importedData.notificationSettings);
                                }
                                
                                if (importedData.darkMode !== undefined) {
                                  await AsyncStorage.setItem('darkMode', JSON.stringify(importedData.darkMode));
                                  if (importedData.darkMode !== isDarkMode) {
                                    toggleTheme();
                                  }
                                }

                                Alert.alert(
                                  '✅ Başarılı!',
                                  `Veriler başarıyla geri yüklendi!\n\n${importedData.tasks.length} görev içe aktarıldı.`
                                );

                              } catch (error) {
                                Alert.alert('Hata', 'Veriler geri yüklenirken hata oluştu: ' + error.message);
                              }
                            }
                          }
                        ]
                      );

                    } catch (parseError) {
                      Alert.alert('Hata', 'Geçersiz JSON formatı! Lütfen doğru yedek verilerini girin.');
                    }
                  }
                }
              ],
              'plain-text'
            );
          }
        }
      ]
    );
  };

  const renderSettingItem = (icon, title, subtitle, onPress, showArrow = true) => (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.border }]} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />}
    </TouchableOpacity>
  );

  const renderSwitchItem = (icon, title, subtitle, value, onValueChange) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.background}
        translucent={false}
      />
      <View style={[styles.header, { 
        paddingTop: insets.top + 15,
        backgroundColor: theme.surface,
        borderBottomColor: theme.border
      }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ayarlar</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bildirimler */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Bildirimler</Text>
          
          {renderSwitchItem(
            'notifications-outline',
            'Bildirimleri Etkinleştir',
            'Görev hatırlatmaları almak için açın',
            notificationSettings.enabled,
            (value) => {
              const newSettings = { ...notificationSettings, enabled: value };
              saveNotificationSettings(newSettings);
            }
          )}

          {notificationSettings.enabled && (
            <>
              {renderSwitchItem(
                'time-outline',
                '10 Dakika Önce',
                'Görev süresi dolmadan 10 dakika önce bildir',
                notificationSettings.tenMinutes,
                (value) => {
                  const newSettings = { ...notificationSettings, tenMinutes: value };
                  saveNotificationSettings(newSettings);
                }
              )}

              {renderSwitchItem(
                'time-outline',
                '30 Dakika Önce',
                'Görev süresi dolmadan 30 dakika önce bildir',
                notificationSettings.thirtyMinutes,
                (value) => {
                  const newSettings = { ...notificationSettings, thirtyMinutes: value };
                  saveNotificationSettings(newSettings);
                }
              )}

              {renderSwitchItem(
                'time-outline',
                '1 Saat Önce',
                'Görev süresi dolmadan 1 saat önce bildir',
                notificationSettings.oneHour,
                (value) => {
                  const newSettings = { ...notificationSettings, oneHour: value };
                  saveNotificationSettings(newSettings);
                }
              )}

              {renderSwitchItem(
                'time-outline',
                '3 Saat Önce',
                'Görev süresi dolmadan 3 saat önce bildir',
                notificationSettings.threeHours,
                (value) => {
                  const newSettings = { ...notificationSettings, threeHours: value };
                  saveNotificationSettings(newSettings);
                }
              )}

              {renderSwitchItem(
                'calendar-outline',
                '24 Saat Önce',
                'Görev süresi dolmadan 1 gün önce bildir',
                notificationSettings.twentyFourHours,
                (value) => {
                  const newSettings = { ...notificationSettings, twentyFourHours: value };
                  saveNotificationSettings(newSettings);
                }
              )}
            </>
          )}
        </View>

        {/* Görünüm */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Görünüm</Text>
          
          {renderSwitchItem(
            'moon-outline',
            'Koyu Mod',
            'Karanlık arayüz temasını etkinleştir',
            isDarkMode,
            handleDarkModeToggle
          )}
        </View>

        {/* Veri Yönetimi */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Veri Yönetimi</Text>
          
          {renderSettingItem(
            'cloud-download-outline',
            'Verileri Dışa Aktar',
            'Görevlerinizi JSON formatında dışa aktarın',
            exportData
          )}

          {renderSettingItem(
            'cloud-upload-outline',
            'Verileri İçe Aktar',
            'Daha önce dışa aktardığınız verileri geri yükleyin',
            importData
          )}

          {renderSettingItem(
            'trash-outline',
            'Tüm Verileri Sil',
            'Tüm görevleri ve ayarları kalıcı olarak sil',
            clearAllData,
            false
          )}
        </View>

        {/* Hakkında */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hakkında</Text>
          
          <View style={[styles.infoItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Versiyon</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>1.0.0</Text>
          </View>

          {renderSettingItem(
            'document-text-outline',
            'Kullanım Koşulları',
            'Uygulama kullanım koşullarını görüntüle',
            () => {
              Alert.alert(
                'Kullanım Koşulları',
                'DoTime Uygulaması ücretsiz bir görev yönetimi uygulamasıdır. Kişisel verileriniz cihazınızda saklanır ve üçüncü taraflarla paylaşılmaz.'
              );
            }
          )}
        </View>
      </ScrollView>

      {/* Footer - Uygulama Bilgileri */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        {/* Kaldırılan uygulama bilgileri */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    padding: 20,
    paddingBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6C757D',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  footerText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  subFooterText: {
    marginTop: 5,
    fontSize: 12,
    color: '#6C757D',
  },
});

export default SettingsScreen; 