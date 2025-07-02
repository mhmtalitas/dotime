import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentContext = createContext();

export const usePayments = () => {
  return useContext(PaymentContext);
};

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentsFromStorage();
  }, []);

  const loadPaymentsFromStorage = async () => {
    try {
      const storedPayments = await AsyncStorage.getItem('payments');
      if (storedPayments !== null) {
        setPayments(JSON.parse(storedPayments));
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Failed to load payments from storage', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAndPersistPayments = async (newPayments) => {
    try {
      setPayments(newPayments);
      await AsyncStorage.setItem('payments', JSON.stringify(newPayments));
    } catch (error) {
      console.error('Failed to save payments to storage', error);
    }
  };

  const addPayment = async (payment) => {
    const newPayments = [...payments, payment];
    await updateAndPersistPayments(newPayments);
  };

  const updatePayment = async (paymentId, updatedData) => {
    const newPayments = payments.map(p => (p.id === paymentId ? { ...p, ...updatedData } : p));
    await updateAndPersistPayments(newPayments);
  };

  const deletePayment = async (paymentId) => {
    const newPayments = payments.filter(p => p.id !== paymentId);
    await updateAndPersistPayments(newPayments);
  };

  const getPaymentById = useCallback((paymentId) => {
    return payments.find(p => p.id === paymentId);
  }, [payments]);

  const value = {
    payments,
    loading,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentById,
    refreshPayments: loadPaymentsFromStorage,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
}; 