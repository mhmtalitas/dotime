import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import EditTaskScreen from '../screens/EditTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import CompletedTasksScreen from '../screens/CompletedTasksScreen';
import SettingsScreen from '../screens/SettingsScreen';

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
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
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
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ title: 'Görevler' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { theme } = useTheme();
  
  return (
    <NavigationContainer>
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
          name="AddTask" 
          component={AddTaskScreen} 
          options={{ 
            title: 'Yeni Görev Ekle',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator; 