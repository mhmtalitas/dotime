import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { View, TouchableOpacity, Alert, Text } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import CompletedTasksScreen from '../screens/CompletedTasksScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import AddPaymentScreen from '../screens/AddPaymentScreen';
import EditPaymentScreen from '../screens/EditPaymentScreen';
import TaskSummaryScreen from '../screens/TaskSummaryScreen';
import PaymentSummaryScreen from '../screens/PaymentSummaryScreen';
import PaymentDetailScreen from '../screens/PaymentDetailScreen';
import OverdueTasksScreen from '../screens/OverdueTasksScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
function TabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home-sharp' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 5,
        },
        headerShown: false,
        tabBarLabel: ({ focused, color }) => {
            let label;
            if (route.name === 'Home') label = 'Ana Sayfa';
            else if (route.name === 'Tasks') label = 'Görevler';
            else if (route.name === 'Payments') label = 'Ödemeler';
            else if (route.name === 'Settings') label = 'Ayarlar';
            return <Text style={{ color, fontSize: 12 }}>{label}</Text>;
        }
      })}
    >
      <Tab.Screen
        name="Ana Sayfa"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="TaskSummaryTab"
        component={TaskSummaryScreen}
        options={{
          title: 'Görev Özeti',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PaymentSummaryTab"
        component={PaymentSummaryScreen}
        options={{
          title: 'Ödeme Özeti',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Tasks" 
        component={TasksScreen} 
        options={{ title: 'Görevler' }} 
      />
      <Stack.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          title: 'Ödemeler',
          headerStyle: {
            backgroundColor: '#007bff',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="AddTask" 
        component={AddTaskScreen} 
        options={{ 
          title: 'Yeni Görev Ekle',
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="AddPayment" 
        component={AddPaymentScreen} 
        options={{ 
          title: 'Yeni Ödeme Ekle',
          presentation: 'card',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="EditTask" 
        component={EditTaskScreen} 
        options={{ 
          title: 'Görevi Düzenle',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen} 
        options={{ title: 'Görev Detayı' }} 
      />
      <Stack.Screen 
        name="CompletedTasks" 
        component={CompletedTasksScreen} 
        options={{ title: 'Tamamlanan Görevler' }} 
      />
      <Stack.Screen 
        name="TaskSummary" 
        component={TaskSummaryScreen} 
        options={{ title: 'Görev Özeti' }} 
      />
      <Stack.Screen 
        name="OverdueTasks" 
        component={OverdueTasksScreen} 
        options={{ title: 'Gecikmiş Görevler' }} 
      />
      <Stack.Screen 
        name="PaymentSummary" 
        component={PaymentSummaryScreen} 
        options={{ title: 'Ödeme Özeti' }} 
      />
      <Stack.Screen 
        name="PaymentDetail" 
        component={PaymentDetailScreen} 
        options={{ title: 'Ödeme Detayı' }} 
      />
      <Stack.Screen name="EditPayment" component={EditPaymentScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator; 