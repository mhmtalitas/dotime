import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Tüm ekranları import edelim
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import CompletedTasksScreen from './src/screens/CompletedTasksScreen';
import OverdueTasksScreen from './src/screens/OverdueTasksScreen';

// DEBUG: Global hata yakalayıcısı
global.ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('🔴 GLOBAL ERROR:', error);
  console.error('🔴 IS FATAL:', isFatal);
  console.error('🔴 ERROR STACK:', error.stack);
  
  if (isFatal) {
    Alert.alert(
      'Kritik Hata',
      `Uygulama çöktü: ${error.name}\n${error.message}`,
      [{text: 'Tamam'}]
    );
  }
});

// DEBUG: Console logları için wrapper
const originalConsole = console.log;
console.log = (...args) => {
  originalConsole('📱 APP LOG:', ...args);
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Hata yakalama bileşeni - Geliştirilmiş
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    console.log('🔴 ERROR BOUNDARY TRIGGERED:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 ERROR BOUNDARY - Error:', error);
    console.error('🔴 ERROR BOUNDARY - Error Info:', errorInfo);
    
    // Hatayı sakla ki kullanıcıya gösterebilk
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>🔴 UYGULAMA HATASI YAKALANDI</Text>
          <Text style={styles.errorSubtitle}>Hata Detayları:</Text>
          <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
          {this.state.errorInfo && (
            <Text style={styles.errorDetail}>
              Component Stack: {this.state.errorInfo.componentStack}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

function MainTabs() {
  console.log('📱 MainTabs component rendering...');
  
  try {
  const { theme } = useTheme();
    console.log('📱 Theme loaded successfully');
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Ana Sayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Görevler') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Ayarlar') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
      <Tab.Screen name="Görevler" component={TasksScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
    </Tab.Navigator>
  );
  } catch (error) {
    console.error('🔴 MainTabs Error:', error);
    throw error;
  }
}

function AppStack() {
  console.log('📱 AppStack component rendering...');
  
  try {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddTask" 
        component={AddTaskScreen}
        options={{
          title: 'Yeni Görev',
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="EditTask" 
        component={EditTaskScreen}
        options={{
          title: 'Görevi Düzenle',
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{
          title: 'Görev Detayları',
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="CompletedTasks" 
        component={CompletedTasksScreen}
        options={{
          title: 'Tamamlanan Görevler',
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="OverdueTasks" 
        component={OverdueTasksScreen}
        options={{
          title: 'Gecikmiş Görevler',
          headerStyle: {
            backgroundColor: theme.danger,
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
  } catch (error) {
    console.error('🔴 AppStack Error:', error);
    throw error;
  }
}

export default function App() {
  console.log('📱 🚀 APP STARTING...');
  
  try {
    console.log('📱 Initializing app components...');
    
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <SafeAreaProvider>
            <NavigationContainer
              onStateChange={(state) => console.log('📱 Navigation state changed:', state)}
              onReady={() => console.log('📱 Navigation ready!')}
            >
              <AppStack />
            </NavigationContainer>
          </SafeAreaProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('🔴 APP RENDER ERROR:', error);
    console.error('🔴 APP ERROR STACK:', error.stack);
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>🔴 APP BAŞLATMA HATASI</Text>
        <Text style={styles.errorText}>{error.toString()}</Text>
        <Text style={styles.errorDetail}>{error.stack}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ff4444',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 12,
    color: '#ffcccc',
    textAlign: 'center',
  },
});
