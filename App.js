import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { PaymentProvider } from './src/context/PaymentContext';
import { NavigationContainer } from '@react-navigation/native';

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

// Hata yakalama bileşeni
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

const App = () => {
  console.log('📱 🚀 APP STARTING...');
  
  try {
    console.log('📱 Initializing app components...');
    
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <PaymentProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </PaymentProvider>
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
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ff3333',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
   errorDetail: {
    fontSize: 12,
    color: '#f0f0f0',
    textAlign: 'left',
    fontFamily: 'monospace',
    marginTop: 10,
  },
});
