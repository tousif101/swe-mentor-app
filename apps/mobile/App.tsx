import './global.css'
import { StatusBar } from 'expo-status-bar'
import { View, Text, Pressable, UIManager, Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ErrorBoundary } from 'react-error-boundary'
import { RootNavigator } from './src/navigation/RootNavigator'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712' }}>
      <Text style={{ color: 'white', fontSize: 18, marginBottom: 16 }}>Something went wrong</Text>
      <Pressable onPress={resetErrorBoundary}>
        <Text style={{ color: '#8b5cf6' }}>Try again</Text>
      </Pressable>
    </View>
  )
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SafeAreaProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
