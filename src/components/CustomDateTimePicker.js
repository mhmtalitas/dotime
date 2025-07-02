import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Bu, eski UI'ı temel alan ama hataları giderilmiş YENİ bileşen.
const CustomDateTimePicker = ({
  isVisible,
  onCancel,
  onConfirm,
  date: initialDate = new Date(),
  mode = 'date' // 'date' or 'time'
}) => {
  const [date, setDate] = useState(initialDate);

  // Görünürlük değiştiğinde veya başlangıç tarihi değiştiğinde state'i güncelle
  useEffect(() => {
    if (isVisible) {
      setDate(initialDate || new Date());
    }
  }, [isVisible]);

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day) => {
    const newDate = new Date(date);
    newDate.setDate(day);
    setDate(newDate);
  };

  const changeMonth = (amount) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + amount);
    setDate(newDate);
  };
  
  const handleHourSelect = (hour) => {
    const newDate = new Date(date);
    newDate.setHours(hour);
    setDate(newDate);
  };

  const handleMinuteSelect = (minute) => {
    const newDate = new Date(date);
    newDate.setMinutes(minute);
    setDate(newDate);
  };

  const handleConfirm = () => {
    // Sadece state'deki güncel tarihi onayla
    onConfirm(date);
    onCancel();
  };
  
  const renderDatePicker = () => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);
    let firstDay = getFirstDayOfMonth(month, year);
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Haftanın başlangıcı Pazartesi

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = day === date.getDate();
      calendarDays.push(
        <TouchableOpacity key={day} style={[styles.dayCell, isSelected && styles.selectedDayCell]} onPress={() => handleDateSelect(day)}>
          <Text style={isSelected ? styles.selectedDayText : styles.dayText}>{day}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={24} color="#007AFF" /></TouchableOpacity>
          <Text style={styles.monthYearText}>{months[month]} {year}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={24} color="#007AFF" /></TouchableOpacity>
        </View>
        <View style={styles.weekDays}>
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => <Text key={day} style={styles.weekDayText}>{day}</Text>)}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays}
        </View>
      </>
    );
  };

  const renderTimePicker = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
        <View style={styles.timePickerContainer}>
            <View style={styles.timeColumn}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {hours.map(hour => (
                        <TouchableOpacity key={hour} onPress={() => handleHourSelect(hour)}>
                            <Text style={[styles.timeText, date.getHours() === hour && styles.selectedTimeText]}>{String(hour).padStart(2, '0')}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeColumn}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {minutes.map(minute => (
                        <TouchableOpacity key={minute} onPress={() => handleMinuteSelect(minute)}>
                            <Text style={[styles.timeText, date.getMinutes() === minute && styles.selectedTimeText]}>{String(minute).padStart(2, '0')}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onCancel}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onCancel} />
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onCancel}><Text style={styles.headerButtonText}>İptal</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>{mode === 'date' ? 'Tarih Seç' : 'Saat Seç'}</Text>
            <TouchableOpacity onPress={handleConfirm}><Text style={[styles.headerButtonText, styles.confirmButton]}>Onayla</Text></TouchableOpacity>
        </View>
        {mode === 'date' ? renderDatePicker() : renderTimePicker()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    headerButtonText: { fontSize: 16, color: '#007AFF' },
    confirmButton: { fontWeight: '600' },
    monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    monthYearText: { fontSize: 18, fontWeight: '600' },
    weekDays: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
    weekDayText: { color: '#888', fontWeight: '500' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: width / 7 - 6, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
    dayText: { fontSize: 16 },
    selectedDayCell: { backgroundColor: '#007AFF', borderRadius: 100 },
    selectedDayText: { color: 'white', fontWeight: 'bold' },
    timePickerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 200, paddingVertical: 10 },
    timeColumn: { flex: 1, alignItems: 'center' },
    timeText: { fontSize: 22, paddingVertical: 8, color: '#aaa' },
    selectedTimeText: { color: '#007AFF', fontWeight: 'bold' },
    timeSeparator: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 10, color: '#007AFF' },
});

export default CustomDateTimePicker;