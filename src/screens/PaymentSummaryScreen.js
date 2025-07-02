import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { usePayments } from '../context/PaymentContext';
import { formatCurrency } from '../utils/formatCurrency';

LocaleConfig.locales['tr'] = {
  monthNames: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
  monthNamesShort: ['Oca.','Şub.','Mar.','Nis.','May.','Haz.','Tem.','Ağu.','Eyl.','Eki.','Kas.','Ara.'],
  dayNames: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],
  dayNamesShort: ['Paz.','Pzt.','Sal.','Çar.','Per.','Cum.','Cmt.'],
  today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

const PaymentSummaryScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme);

  const { payments } = usePayments(); // Get payments from global context

  const [viewMode, setViewMode] = useState('list');
  const [selectedDate, setSelectedDate] = useState('');

  const summary = useMemo(() => {
    const now = new Date();
    const unpaidPayments = payments.filter(p => !p.isPaid);
    return {
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paid: payments.length - unpaidPayments.length,
      unpaid: unpaidPayments.length,
      overdue: unpaidPayments.filter(p => new Date(p.dueDate) < now).length,
    };
  }, [payments]);
  
  const upcomingPayments = useMemo(() => {
     const now = new Date();
     return payments
      .filter(p => !p.isPaid && new Date(p.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [payments]);

  const markedDates = useMemo(() => {
    const marks = {};
    payments
      .filter(payment => payment.status !== 'completed') // Filter out completed payments
      .forEach(payment => {
        const dateString = new Date(payment.dueDate).toISOString().split('T')[0];
        if (!marks[dateString]) {
          marks[dateString] = { dots: [] };
        }
        marks[dateString].dots.push({
          key: payment.id,
          color: typeof payment.category === 'object' ? payment.category.color : theme.primary,
        });
      });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}), // Keep the dot if it exists
        selected: true,
        selectedColor: theme.primary,
      };
    }
    return marks;
  }, [payments, selectedDate, theme.primary]);
  
  const paymentsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return payments.filter(p => new Date(p.dueDate).toISOString().split('T')[0] === selectedDate);
  }, [payments, selectedDate]);

  const onDayPress = (day) => {
    const dateString = day.dateString;
    setSelectedDate(dateString);
  };

  const SummaryCard = ({ title, count, color, screen, params }) => (
    <TouchableOpacity style={[styles.summaryCard, { backgroundColor: color }]} onPress={() => screen && navigation.navigate(screen, params)}>
      <Text style={styles.summaryCardCount}>{count}</Text>
      <Text style={styles.summaryCardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickActionItem = ({ icon, title, subtitle, onPress, iconColor }) => (
    <TouchableOpacity style={[styles.quickActionItem, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.quickActionText}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.quickActionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  const PaymentItem = ({ payment }) => {
    const isOverdue = !payment.isPaid && new Date(payment.dueDate) < new Date();
    const dueDateText = new Date(payment.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Handle both old (string) and new (object) category formats
    const categoryColor = typeof payment.category === 'object' ? payment.category.color : theme.primary;
    const borderColor = isOverdue ? theme.danger : categoryColor;

    return (
      <TouchableOpacity style={[styles.paymentItem, { borderLeftColor: borderColor }]} onPress={() => navigation.navigate('PaymentDetail', { paymentId: payment.id })}>
        <View style={styles.paymentItemDetails}>
          <Text style={[styles.paymentItemTitle, { color: theme.text }]}>{payment.title}</Text>
          <Text style={[styles.paymentItemRecipient, { color: theme.textSecondary }]}>{payment.recipient}</Text>
        </View>
        <View style={styles.paymentItemRightContainer}>
          <Text style={[styles.paymentItemAmount, { color: borderColor }]}>{formatCurrency(payment.amount)}</Text>
          <Text style={[styles.paymentItemDate, { color: theme.textSecondary }]}>{dueDateText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListView = () => (
    <>
      <View style={styles.summaryGrid}>
          <SummaryCard title="Toplam Tutar" count={formatCurrency(summary.totalAmount).replace(' TL', '')} color="#007AFF" />
          <SummaryCard title="Ödenmemiş" count={summary.unpaid} color="#FF9500" screen="Payments" params={{ filter: 'unpaid', title: 'Ödenmemiş Ödemeler' }} />
          <SummaryCard title="Ödenen" count={summary.paid} color="#34C759" screen="Payments" params={{ filter: 'completed', title: 'Tamamlanmış Ödemeler' }}/>
          <SummaryCard title="Gecikmiş" count={summary.overdue} color="#FF3B30" screen="Payments" params={{ filter: 'overdue', title: 'Gecikmiş Ödemeler' }}/>
      </View>
      <Text style={[styles.sectionHeader, { color: theme.text }]}>Hızlı Eylemler</Text>
      <QuickActionItem
        icon="add-circle"
        title="Yeni Ödeme Ekle"
        subtitle="Yeni bir fatura veya ödeme gir"
        onPress={() => navigation.navigate('AddPayment')}
        iconColor={theme.primary}
      />
      <QuickActionItem
        icon="checkmark-circle"
        title="Tamamlanmış Ödemeler"
        subtitle={`${summary.paid} ödeme tamamlandı`}
        onPress={() => navigation.navigate('Payments', { filter: 'completed', title: 'Tamamlanmış Ödemeler' })}
        iconColor={theme.success}
      />
      <QuickActionItem
        icon="alert-circle"
        title="Gecikmiş Ödemeler"
        subtitle={`${summary.overdue} ödeme gecikti`}
        onPress={() => navigation.navigate('Payments', { filter: 'overdue', title: 'Gecikmiş Ödemeler' })}
        iconColor={theme.danger}
      />
      <View style={styles.upcomingHeader}>
          <Text style={[styles.sectionHeader, { color: theme.text }]}>Yaklaşan Ödemeler</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
              <Text style={[styles.viewAll, { color: theme.primary }]}>Tümünü Gör</Text>
          </TouchableOpacity>
      </View>
      {upcomingPayments.length > 0 ? (
          upcomingPayments.map(p => <PaymentItem key={p.id} payment={p} />)
      ) : (
          <Text style={[styles.noTasksText, {color: theme.textSecondary}]}>Yaklaşan ödeme bulunmuyor.</Text>
      )}
    </>
  );

  const renderCalendarView = () => (
    <>
      <Calendar
        current={new Date().toISOString().split('T')[0]}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.background,
          calendarBackground: theme.surface,
          textSectionTitleColor: theme.textSecondary,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: '#ffffff',
          todayTextColor: theme.primary,
          dayTextColor: theme.text,
          textDisabledColor: theme.border,
          dotColor: theme.primary,
          selectedDotColor: '#ffffff',
          arrowColor: theme.primary,
          monthTextColor: theme.text,
          indicatorColor: theme.primary,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />
      {selectedDate ? (
        <View style={styles.selectedDayContainer}>
          <Text style={[styles.sectionHeader, { color: theme.text, alignSelf: 'center', marginBottom: 10 }]}>
            {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} Ödemeleri
          </Text>
          {paymentsOnSelectedDate.length > 0 ? (
            paymentsOnSelectedDate.map(p => <PaymentItem key={p.id} payment={p} />)
          ) : (
            <Text style={[styles.noTasksText, {color: theme.textSecondary}]}>Bu güne ait ödeme bulunmuyor.</Text>
          )}
        </View>
      ) : null}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} translucent={false} />
        <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.header, { color: theme.text }]}>Ödeme Özeti</Text>
            
            <View style={styles.viewModeContainer}>
                <TouchableOpacity 
                    style={[styles.viewModeButton, viewMode === 'list' ? styles.viewModeButtonActive : {}]} 
                    onPress={() => setViewMode('list')}
                >
                    <Ionicons name="list-outline" size={20} color={viewMode === 'list' ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.viewModeText, {color: viewMode === 'list' ? theme.primary : theme.textSecondary}]}>Liste</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.viewModeButton, viewMode === 'calendar' ? styles.viewModeButtonActive : {}]} 
                    onPress={() => setViewMode('calendar')}
                >
                    <Ionicons name="calendar-outline" size={20} color={viewMode === 'calendar' ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.viewModeText, {color: viewMode === 'calendar' ? theme.primary : theme.textSecondary}]}>Takvim</Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'list' ? renderListView() : renderCalendarView()}
        </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  summaryCardCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.text,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  viewAll: {
    fontSize: 15,
    fontWeight: '600',
  },
  paymentItem: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 5,
  },
  paymentItemDetails: {
    flex: 1,
    marginRight: 10,
  },
  paymentItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  paymentItemRecipient: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  paymentItemRightContainer: {
    alignItems: 'flex-end',
  },
  paymentItemAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  paymentItemDate: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  noTasksText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 15,
    color: theme.textSecondary
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewModeButtonActive: {
    backgroundColor: theme.background,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  viewModeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedDayContainer: {
    marginTop: 20,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
});

export default PaymentSummaryScreen; 