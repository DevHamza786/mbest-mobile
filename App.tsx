/**
 * MBEST Mobile App
 * Main App Component
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from './src/providers/QueryProvider';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppNavigator />
      </SafeAreaProvider>
    </QueryProvider>
  );
}

export default App;
