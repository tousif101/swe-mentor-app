import * as Haptics from 'expo-haptics'
import { Platform, ToastAndroid } from 'react-native'
import { logger } from './logger'

/**
 * Haptic feedback types
 */
export type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium'

/**
 * Trigger haptic feedback
 * Gracefully handles environments where haptics aren't available (e.g., simulator)
 */
export async function triggerHaptic(type: HapticType = 'success'): Promise<void> {
  try {
    switch (type) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        break
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        break
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        break
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        break
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        break
    }
  } catch {
    // Haptics not available (e.g., simulator, unsupported device)
    logger.debug('Haptics not available')
  }
}

/**
 * Toast message types
 */
export type ToastType = 'success' | 'error' | 'info'

/**
 * Show a toast message
 * On Android, uses native ToastAndroid
 * On iOS, logs to console (implement with react-native-toast-message for production)
 */
export function showToast(message: string, type: ToastType = 'success'): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  } else {
    // iOS: For production, implement with react-native-toast-message
    // For now, log to console as placeholder
    logger.info(`[Toast ${type}]: ${message}`)
  }
}

/**
 * Combined feedback - haptic + toast
 * Use for save/submit actions
 */
export async function showFeedback(
  message: string,
  type: 'success' | 'error' = 'success'
): Promise<void> {
  await triggerHaptic(type)
  showToast(message, type)
}
