import React, { useMemo, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { usePayments } from '../context/PaymentContext';
import { formatCurrency } from '../utils/formatCurrency';

const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const today = new Date();
    
    const options = { day: 'numeric', month: 'short' };
    const time = date.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'});

    if (date.toDateString() === today.toDateString()) {
        return `Bugün`;
    }
    
    return date.toLocaleDateString('tr-TR', options);
};

const getCategoryProps = (paymentCategory, theme) => {
    // Handles both new object format and old string format for backward compatibility
    if (typeof paymentCategory === 'object' && paymentCategory !== null) {
        return {
            label: paymentCategory.label || 'Etiketsiz',
            color: paymentCategory.color || theme.primary
        };
    }
    // Fallback for old data or undefined category
    return {
        label: paymentCategory || 'Genel',
        color: theme.primary
    };
};

const PaymentsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { payments, updatePayment } = usePayments();
  
  const filter = route.params?.filter || 'unpaid';

  useLayoutEffect(() => {
    const screenTitle = route.params?.title || 'Bekleyen Ödemeler';
    navigation.setOptions({ title: screenTitle });
  }, [route.params?.title, navigation]);

  const filteredPayments = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'completed':
        return payments.filter(p => p.isPaid).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
      case 'overdue':
        return payments.filter(p => !p.isPaid && new Date(p.dueDate) < now).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      case 'unpaid':
      default:
        return payments.filter(p => !p.isPaid).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
  }, [payments, filter]);

  const confirmPaid = (payment) => {
      Alert.alert(
          'Ödemeyi Onayla',
          `"${payment.title}" başlıklı ödemeyi yapıldı olarak işaretlemek istiyor musunuz?`,
          [
              { text: 'İptal', style: 'cancel' },
              { text: 'Evet, Ödendi', onPress: async () => {
                  try {
                    await updatePayment(payment.id, { isPaid: true, paidAt: new Date().getTime() });
                  } catch (error) {
                    Alert.alert('Hata', 'Ödeme durumu güncellenirken bir sorun oluştu.');
                  }
              }},
          ]
      );
  };
  
  const renderPaymentCard = ({ item }) => {
    const isOverdue = !item.isPaid && new Date(item.dueDate) < new Date();
    const categoryProps = getCategoryProps(item.category, theme);

    // Overdue cards have a distinct, alarming style
    if (isOverdue) {
        return (
            <TouchableOpacity 
                style={[styles.cardContainer, { backgroundColor: theme.danger }]}
                onPress={() => navigation.navigate('PaymentDetail', { paymentId: item.id })}
                onLongPress={() => confirmPaid(item)}
            >
                <View style={styles.cardTopRow}>
                    <View style={[styles.categoryTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Text style={styles.categoryTagText}>{categoryProps.label}</Text>
                    </View>
                    <Ionicons name="alert-circle-outline" size={28} color="#fff" />
                </View>
                <View style={styles.cardMainRow}>
                    <Text style={[styles.titleText, { color: '#fff' }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.amountText, { color: '#fff' }]}>{formatCurrency(item.amount)}</Text>
                </View>
                <View style={styles.cardBottomRow}>
                    <Ionicons name="calendar-outline" size={16} color="#fff" />
                    <Text style={[styles.dueDateText, { color: '#fff' }]}>
                        GECİKMİŞ: {formatDeadline(item.dueDate)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    // This is the standard card design with the colored border restored
    return (
        <TouchableOpacity 
            style={[
                styles.cardContainer, 
                { 
                    backgroundColor: theme.surface,
                    borderColor: categoryProps.color,
                    borderWidth: 1.5,
                }
            ]}
            onPress={() => navigation.navigate('PaymentDetail', { paymentId: item.id })}
            onLongPress={() => !item.isPaid && confirmPaid(item)}
        >
            <View style={styles.cardTopRow}>
                <View style={[styles.categoryTag, { backgroundColor: categoryProps.color }]}>
                    <Text style={styles.categoryTagText}>{categoryProps.label}</Text>
                </View>
                {!item.isPaid && filter !== 'completed' && (
                    <TouchableOpacity onPress={() => confirmPaid(item)}>
                        <Ionicons name="checkmark-circle-outline" size={28} color={theme.success} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.cardMainRow}>
                <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.amountText, { color: theme.text }]}>{formatCurrency(item.amount)}</Text>
            </View>

            <View style={styles.cardBottomRow}>
                <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.dueDateText, {color: theme.textSecondary}]}>
                    Son Ödeme: {formatDeadline(item.dueDate)}
                </Text>
            </View>
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.background} />
      {filteredPayments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Burada hiç ödeme yok</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Görünüşe göre bu kategoride listelenecek bir ödeme bulunmuyor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          renderItem={renderPaymentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    listContainer: { 
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    cardContainer: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 4,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryTag: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    categoryTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleText: {
        fontSize: 20,
        fontWeight: '600',
        flex: 1, 
        marginRight: 10,
    },
    amountText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dueDateText: {
        marginLeft: 8,
        fontSize: 14,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    }
});

export default PaymentsScreen; 