import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import CustomDateTimePicker from '../components/CustomDateTimePicker';
import { usePayments } from '../context/PaymentContext';
import NotificationService from '../services/NotificationService';

const AddPaymentScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { addPayment } = usePayments();
    
    const [title, setTitle] = useState('');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [category, setCategory] = useState('Kredi Kartı');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const paymentCategories = [
        { key: 'Kredi Kartı', label: 'Kredi Kartı', icon: 'card-outline', color: '#007AFF' },
        { key: 'Çek', label: 'Çek', icon: 'document-text-outline', color: '#5856D6' },
        { key: 'Senet', label: 'Senet', icon: 'document-attach-outline', color: '#FF9500' },
        { key: 'Maaş', label: 'Maaş', icon: 'cash-outline', color: '#34C759' },
        { key: 'Kiralar', label: 'Kiralar', icon: 'home-outline', color: '#AF52DE' },
        { key: 'Sigorta', label: 'Sigorta', icon: 'shield-checkmark-outline', color: '#5AC8FA' },
    ];

    const handleDateConfirm = (date) => {
        const newDueDate = new Date(dueDate);
        newDueDate.setFullYear(date.getFullYear());
        newDueDate.setMonth(date.getMonth());
        newDueDate.setDate(date.getDate());
        setDueDate(newDueDate);
        setShowDatePicker(false);
    };

    const handleTimeConfirm = (time) => {
        const newDueDate = new Date(dueDate);
        newDueDate.setHours(time.getHours());
        newDueDate.setMinutes(time.getMinutes());
        setDueDate(newDueDate);
        setShowTimePicker(false);
    };

    const handleSave = async () => {
        if (!title.trim() || !recipient.trim() || !amount.trim()) {
            Alert.alert('Eksik Bilgi', 'Lütfen başlık, nereye ödeneceği ve tutar alanlarını doldurun.');
            return;
        }

        const selectedCategory = paymentCategories.find(c => c.key === category);
        if (!selectedCategory) {
            Alert.alert('Hata', 'Geçerli bir kategori seçilmedi.');
            return;
        }

        try {
            const newPayment = {
                id: Date.now().toString(),
                title: title.trim(),
                recipient: recipient.trim(),
                amount: parseFloat(amount.replace(',', '.')),
                category: selectedCategory,
                dueDate: dueDate.getTime(),
                notes: notes.trim(),
                isPaid: false,
                createdAt: new Date().getTime(),
            };

            await addPayment(newPayment);
            
            // Yeni ödeme için bildirimleri kur (Doğrudan singleton instance'ı kullan)
            await NotificationService.schedulePaymentReminders(newPayment);

            Alert.alert('Başarılı!', 'Ödemeniz başarıyla kaydedildi.', [
                { text: 'Tamam', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.error('Ödeme kaydedilirken hata:', error);
            Alert.alert('Hata', 'Ödeme kaydedilirken bir sorun oluştu.');
        }
    };
    
    const formatDate = (date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (new Date(date).toDateString() === today.toDateString()) {
            return 'Bugün';
        }
        if (new Date(date).toDateString() === tomorrow.toDateString()) {
            return 'Yarın';
        }
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    const formatTime = (date) => {
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit', minute: '2-digit'
        });
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scrollContainer: {
            flexGrow: 1,
            padding: 20,
        },
        label: {
            fontSize: 16,
            color: theme.textSecondary,
            marginBottom: 8,
            fontWeight: '600',
        },
        input: {
            backgroundColor: theme.surface,
            color: theme.text,
            padding: 15,
            borderRadius: 10,
            fontSize: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.border,
        },
        datePickerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        datePickerContainer: {
            width: '48%',
        },
        dateTimeDisplayBox: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 15,
        },
        dateTimeTextContainer: {
            marginLeft: 15,
        },
        dateTimeDateText: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
        },
        dateTimeTimeText: {
            fontSize: 16,
            color: theme.textSecondary,
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            borderRadius: 12,
        },
        dateButton: {
            backgroundColor: '#007AFF',
            marginRight: 10,
        },
        timeButton: {
            backgroundColor: '#34C759',
            marginLeft: 10,
        },
        actionButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
        },
        dateDisplay: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.surface,
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.border,
        },
        dateText: {
            color: theme.text,
            fontSize: 16,
        },
        amountInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 20,
        },
        amountInput: {
            flex: 1,
            padding: 15,
            fontSize: 16,
            color: theme.text,
        },
        currencyText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.primary,
            paddingHorizontal: 15,
        },
        notesInput: {
            height: 120,
            textAlignVertical: 'top',
        },
        saveButton: {
            backgroundColor: '#34C759',
            flexDirection: 'row',
            padding: 18,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
        },
        saveButtonText: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            marginLeft: 10,
        },
        categoryContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: -5,
        },
        categoryButton: {
            width: '32%',
            aspectRatio: 1, // Kare butonlar için
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 15,
            borderWidth: 1.5,
            marginBottom: 10,
            padding: 5,
        },
        categoryButtonText: {
            marginTop: 8,
            fontSize: 12,
            fontWeight: '600',
            textAlign: 'center',
        },
        dateTimeDisplay: {
            borderRadius: 16,
            padding: 24,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
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
            color: theme.text,
        },
        timeText: {
            fontSize: 18,
            fontWeight: '500',
            color: theme.textSecondary,
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
        },
        dateButtonText: {
            color: 'white',
            fontWeight: '600',
        },
    });

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.label}>Ödeme Başlığı</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ödeme başlığı girin"
                    placeholderTextColor={theme.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                    allowFontScaling={false}
                    autoCorrect={false}
                    spellCheck={false}
                />

                <Text style={styles.label}>Nereye Ödenecek?</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nereye ödeneceğini girin"
                    placeholderTextColor={theme.textSecondary}
                    value={recipient}
                    onChangeText={setRecipient}
                    allowFontScaling={false}
                    autoCorrect={false}
                    spellCheck={false}
                />

                <Text style={styles.label}>Kategori</Text>
                <View style={styles.categoryContainer}>
                    {paymentCategories.map((cat) => (
                        <TouchableOpacity
                            key={cat.key}
                            onPress={() => setCategory(cat.key)}
                            style={[
                                styles.categoryButton,
                                { 
                                    backgroundColor: category === cat.key ? cat.color : theme.surface,
                                    borderColor: category === cat.key ? cat.color : theme.border,
                                }
                            ]}
                        >
                            <Ionicons 
                                name={cat.icon}
                                size={30} 
                                color={category === cat.key ? 'white' : theme.textSecondary}
                            />
                            <Text style={{
                                ...styles.categoryButtonText,
                                color: category === cat.key ? 'white' : theme.textSecondary,
                            }}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Tutar</Text>
                <View style={styles.amountInputContainer}>
                    <TextInput
                        style={styles.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={theme.textSecondary}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        allowFontScaling={false}
                    />
                    <Text style={styles.currencyText}>TL</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Son Tarih ve Saat</Text>
                    <View style={[styles.dateTimeDisplay]}>
                        <View style={styles.dateTimeInfo}>
                        <Ionicons name="calendar" size={24} color={theme.primary} />
                        <View style={styles.dateTimeTexts}>
                            <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
                            <Text style={styles.timeText}>{formatTime(dueDate)}</Text>
                        </View>
                        </View>
                    </View>
                    <View style={styles.dateTimeButtons}>
                        <TouchableOpacity
                        style={[styles.dateTimeButton, { backgroundColor: theme.primary }]}
                        onPress={() => setShowDatePicker(true)}
                        >
                        <Ionicons name="calendar-outline" size={20} color="white" />
                        <Text style={styles.dateButtonText}>Tarih Seç</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                        style={[styles.dateTimeButton, { backgroundColor: theme.success }]}
                        onPress={() => setShowTimePicker(true)}
                        >
                        <Ionicons name="time-outline" size={20} color="white" />
                        <Text style={styles.dateButtonText}>Saat Seç</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <CustomDateTimePicker
                    isVisible={showDatePicker}
                    mode="date"
                    onConfirm={handleDateConfirm}
                    onCancel={() => setShowDatePicker(false)}
                    date={dueDate}
                />

                <CustomDateTimePicker
                    isVisible={showTimePicker}
                    mode="time"
                    onConfirm={handleTimeConfirm}
                    onCancel={() => setShowTimePicker(false)}
                    date={dueDate}
                />

                <Text style={[styles.label, {marginTop: 10}]}>Notlar</Text>
                <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder="Ek notlar (isteğe bağlı)"
                    placeholderTextColor={theme.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    allowFontScaling={false}
                    autoCorrect={false}
                    spellCheck={false}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                    <Text style={styles.saveButtonText}>Ödemeyi Kaydet</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default AddPaymentScreen; 