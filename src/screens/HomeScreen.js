import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePayments } from '../context/PaymentContext';
import { formatCurrency } from '../utils/formatCurrency';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payments } = usePayments();
  const [tasks, setTasks] = useState([]);
  const [isMenuVisible, setMenuVisible] = useState(false);

  const loadData = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks);
        }
      }
    } catch (error) {
      console.error('Error loading tasks from storage', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );
  
  const paymentSummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const unpaidPayments = payments.filter(p => {
      if (p.isPaid) {
        return false;
      }
      const paymentDate = new Date(p.dueDate);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    const totalUnpaidAmount = unpaidPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      count: unpaidPayments.length,
      totalAmount: totalUnpaidAmount,
    };
  }, [payments]);
  
  const taskSummary = useMemo(() => {
    const upcomingTasks = tasks.filter(task => !task.completed);
    const overdueTasks = upcomingTasks.filter(task => new Date(task.dueDate) < new Date());
    return {
      upcomingTasksCount: upcomingTasks.length,
      overdueTasksCount: overdueTasks.length,
    };
  }, [tasks]);

  const currentMonth = new Date().toLocaleString('tr-TR', { month: 'long' });

  const toggleMenu = () => {
    setMenuVisible(!isMenuVisible);
  };

  const navigateAndClose = (screen) => {
    toggleMenu();
    navigation.navigate(screen);
  };

  const handleTaskCardPress = () => {
    navigation.navigate('Tasks');
  };

  const handleOverdueTasksPress = () => {
    navigation.navigate('Tasks');
  };

  const handlePaymentCardPress = () => {
    // ... existing code ...
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: insets.top,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
    },
    addButton: {
      backgroundColor: theme.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: 15,
    },
    card: {
      flex: 1,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      marginVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 8,
    },
    cardContent: {
      alignItems: 'center',
    },
    cardIcon: {
      marginBottom: 15,
    },
    cardTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 5,
    },
    monthText: {
      fontSize: 22,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: 'bold',
      marginBottom: 15,
      textTransform: 'capitalize',
    },
    summaryText: {
      fontSize: 18,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
    },
    amountText: {
      fontSize: 26,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 8,
    },
    overdueText: {
      marginTop: 10,
      fontSize: 16,
      color: '#FFDDC1',
      fontWeight: 'bold',
      textDecorationLine: 'underline',
    },
  });

  const modalStyles = StyleSheet.create({
    modalContent: {
      padding: 22,
      borderRadius: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
    },
    menuItemText: {
      fontSize: 18,
      marginLeft: 15,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Genel Bakış</Text>
        <TouchableOpacity style={styles.addButton} onPress={toggleMenu}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Pressable
          style={{ flex: 1 }}
          onPress={handleTaskCardPress}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: false }}
        >
          <LinearGradient
            colors={['#4a90e2', '#2a6cb5']}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <Ionicons name="list-circle-outline" size={60} color="white" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Görevler</Text>
              <Text style={styles.summaryText}>
                Yaklaşan {taskSummary.upcomingTasksCount} göreviniz var.
              </Text>
              {taskSummary.overdueTasksCount > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('OverdueTasks')}>
                  <Text style={styles.overdueText}>
                    {taskSummary.overdueTasksCount} tanesi gecikmiş!
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('Payments')}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: false }}
        >
          <LinearGradient
            colors={['#50c9c3', '#33a59e']}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <Ionicons name="card-outline" size={60} color="white" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Ödemeler</Text>
              <Text style={styles.monthText}>{currentMonth}</Text>
              <Text style={styles.summaryText}>
                  Toplam {paymentSummary.count} bekleyen ödeme
              </Text>
              <Text style={styles.amountText}>
                  {formatCurrency(paymentSummary.totalAmount)}
              </Text>
            </View>
          </LinearGradient>
        </Pressable>
      </View>
      <Modal
        isVisible={isMenuVisible}
        onBackdropPress={toggleMenu}
        animationIn="zoomIn"
        animationOut="zoomOut"
      >
        <View style={[modalStyles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={modalStyles.modalHeader}>
            <Text style={[modalStyles.modalTitle, { color: theme.text }]}>Ne Eklemek İstersin?</Text>
            <TouchableOpacity onPress={toggleMenu}>
              <Ionicons name="close-circle" size={30} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={modalStyles.menuItem} onPress={() => navigateAndClose('AddTask')}>
            <Ionicons name="document-text-outline" size={24} color={theme.primary} />
            <Text style={[modalStyles.menuItemText, { color: theme.text }]}>Yeni Görev</Text>
          </TouchableOpacity>
          <TouchableOpacity style={modalStyles.menuItem} onPress={() => navigateAndClose('AddPayment')}>
            <Ionicons name="wallet-outline" size={24} color={theme.primary} />
            <Text style={[modalStyles.menuItemText, { color: theme.text }]}>Yeni Ödeme</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen; 