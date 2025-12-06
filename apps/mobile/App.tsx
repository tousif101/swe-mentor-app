import "./global.css";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-gray-950">
        <View className="flex-1 items-center justify-center px-6">
          <LinearGradient
            colors={["#4c1d95", "#7c3aed", "#8b5cf6", "#a78bfa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-24 h-24 rounded-3xl mb-8 items-center justify-center"
          >
            <Text className="text-white text-4xl font-bold">SW</Text>
          </LinearGradient>
          <Text className="text-3xl font-bold text-white mb-4">
            SWE Mentor
          </Text>
          <Text className="text-gray-400 text-center mb-8">
            Your AI-powered career companion
          </Text>
          <Text className="text-primary-400 text-sm">Hello World</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
