import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { usePayments } from '../context/PaymentContext';
import { formatCurrency } from '../utils/formatCurrency';
import NotificationService from '../services/NotificationService';

const PaymentDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { paymentId } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { getPaymentById, updatePayment, deletePayment, loading } = usePayments();
  const payment = getPaymentById(paymentId);

  const paymentCategories = {
    'Kredi Kartı': { icon: 'card-outline', color: '#007AFF' },
    'Çek': { icon: 'document-text-outline', color: '#5856D6' },
    'Senet': { icon: 'document-attach-outline', color: '#FF9500' },
    'Maaş': { icon: 'cash-outline', color: '#34C759' },
    'Kiralar': { icon: 'home-outline', color: '#AF52DE' },
    'Sigorta': { icon: 'shield-checkmark-outline', color: '#5AC8FA' },
    'Diğer': { icon: 'ellipsis-horizontal-outline', color: '#8E8E93' }
  };

  const getCategoryFromPayment = (payment) => {
    if (typeof payment.category === 'object' && payment.category !== null) {
      return payment.category;
    }
    if (typeof payment.category === 'string') {
      const style = paymentCategories[payment.category] || paymentCategories['Diğer'];
      return { key: payment.category, label: payment.category, ...style };
    }
    const style = paymentCategories['Diğer'];
    return { key: 'Diğer', label: 'Diğer', ...style };
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const confirmPaid = () => {
    Alert.alert(
      'Ödemeyi Onayla',
      `"${payment.title}" başlıklı ödemeyi yaptınız mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Onayla', onPress: markAsPaid },
      ]
    );
  };

  const markAsPaid = async () => {
    try {
      await updatePayment(payment.id, { isPaid: true, paidAt: new Date().getTime() });
      
      // Bildirimleri iptal et (Doğrudan singleton instance'ı kullan)
      await NotificationService.cancelPaymentNotifications(payment.id);

      Alert.alert('Başarılı', 'Ödeme tamamlandı!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Ödemeyi Sil',
      'Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: deletePaymentHandler },
      ]
    );
  };

  const deletePaymentHandler = async () => {
    try {
      await deletePayment(payment.id);

      // Bildirimleri iptal et (Doğrudan singleton instance'ı kullan)
      await NotificationService.cancelPaymentNotifications(payment.id);

      Alert.alert('Başarılı', 'Ödeme silindi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
       Alert.alert('Hata', 'Ödeme silinirken bir hata oluştu.');
    }
  };

  const getTimeRemaining = () => {
    const deadline = new Date(payment.dueDate);
    const now = new Date();
    const diffTime = deadline - now;

    if (diffTime < 0) return 'Süresi geçmiş';
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} gün kaldı`;
    if (hours > 0) return `${hours} saat kaldı`;
    return 'Bugün son gün';
  };
  
  const handleEdit = () => {
    navigation.navigate('EditPayment', { payment });
  };

  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  if (!payment) {
    return <View style={[styles.container, styles.centered]}><Text style={{ color: theme.text }}>Ödeme bilgileri bulunamadı.</Text></View>;
  }
  
  const isOverdue = !payment.isPaid && new Date(payment.dueDate) < new Date();
  const categoryStyle = getCategoryFromPayment(payment);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 150 }} // Footer için boşluk
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.color }]}>
            <Ionicons name={categoryStyle.icon} size={16} color="white" />
            <Text style={styles.categoryText}>{categoryStyle.label}</Text>
          </View>
          <View style={[styles.timeRemaining, { backgroundColor: isOverdue ? theme.danger + '20' : theme.primary + '20' }]}>
            <Text style={[styles.timeText, { color: isOverdue ? theme.danger : theme.primary }]}>
              {getTimeRemaining()}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>{payment.title}</Text>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={24} color={theme.textSecondary} style={styles.icon} />
            <View>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Tutar</Text>
              <Text style={[styles.detailValue, styles.amount, { color: theme.text }]}>
                {formatCurrency(payment.amount)}
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Alıcı Bilgisi</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>{payment.recipient}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Son Ödeme Tarihi</Text>
            <View style={[styles.dateContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.text }]}>{formatDateTime(payment.dueDate)}</Text>
            </View>
          </View>

          {payment.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Notlar</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>{payment.notes}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Ödeme Bilgileri</Text>
            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Durum:</Text>
              <Text style={[styles.infoValue, { color: payment.isPaid ? theme.success : theme.danger }]}>
                {payment.isPaid ? 'Ödendi' : 'Ödenmedi'}
              </Text>
            </View>
            {payment.isPaid && (
              <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Ödenme Tarihi:</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{formatDateTime(payment.paidAt)}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {!payment.isPaid && (
        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={[styles.button, styles.editButton, {backgroundColor: theme.primary + '20'}]} onPress={handleEdit}>
            <Ionicons name="pencil-outline" size={20} color={theme.primary} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.completeButton]} onPress={confirmPaid}>
            <Ionicons name="checkmark-done-outline" size={20} color={'#fff'} />
            <Text style={[styles.buttonText, { color: '#fff' }]}>Ödendi</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.deleteButton, { bottom: (payment.isPaid ? 0 : 85) + insets.bottom + 10, backgroundColor: theme.danger + '20' }]}
        onPress={confirmDelete}
      >
        <Text style={[styles.deleteButtonText, { color: theme.danger }]}>Ödemeyi Sil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  timeRemaining: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
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
  editButton: {},
  completeButton: {
    backgroundColor: '#007AFF',
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
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PaymentDetailScreen; 