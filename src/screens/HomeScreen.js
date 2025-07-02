import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePayments } from '../context/PaymentContext';
import { formatCurrency } from '../utils/formatCurrency';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { payments } = usePayments();
  const [tasks, setTasks] = useState([]);

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
    const unpaidPayments = payments.filter(p => !p.isPaid);
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

  const showAddMenu = () => {
    Alert.alert(
      'Ne Eklemek İstersin?',
      '',
      [
        { text: 'Yeni Görev', onPress: () => navigation.navigate('AddTask') },
        { text: 'Yeni Ödeme', onPress: () => navigation.navigate('AddPayment') },
        { text: 'İptal', style: 'cancel' }
      ]
    );
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
      marginBottom: 20,
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
    }
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Genel Bakış</Text>
        <TouchableOpacity style={styles.addButton} onPress={showAddMenu}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={{flex: 1}} onPress={handleTaskCardPress}>
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
        </TouchableOpacity>

        <TouchableOpacity style={{flex: 1}} onPress={() => navigation.navigate('Payments')}>
          <LinearGradient
            colors={['#50c9c3', '#33a59e']}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <Ionicons name="card-outline" size={60} color="white" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Ödemeler</Text>
              <Text style={styles.summaryText}>
                  Toplam {paymentSummary.count} bekleyen ödeme
              </Text>
              <Text style={styles.amountText}>
                  {formatCurrency(paymentSummary.totalAmount)}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen; 