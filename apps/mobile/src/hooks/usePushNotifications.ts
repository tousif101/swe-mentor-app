import { useEffect, useRef, useCallback, useState } from 'react'
import { Platform, AppState, AppStateStatus } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import type { EventSubscription } from 'expo-modules-core'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { logger } from '../utils'
import { PUSH_NOTIFICATION_CONFIG } from '../constants'

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

type NotificationData = {
  type?: 'morning_reminder' | 'evening_reminder'
  screen?: 'MorningCheckIn' | 'EveningCheckIn'
}

type UsePushNotificationsOptions = {
  onNotificationTap?: (data: NotificationData) => void
}

type UsePushNotificationsReturn = {
  expoPushToken: string | null
  isRegistering: boolean
  error: Error | null
  requestPermission: () => Promise<boolean>
}

/**
 * Hook to manage push notification registration and handling.
 * Automatically registers for push notifications when user is authenticated.
 * Stores push token in Supabase for server-side notification sending.
 *
 * TODO(security): Token duplication not prevented at DB level - consider adding
 *   unique constraint or partial unique index on push_token column
 * TODO(ux): Missing permission re-request UI guidance - when permission is denied,
 *   provide users with instructions to enable in device settings
 * TODO(cleanup): Missing token invalidation on logout - clear push_token from DB
 *   when user logs out to prevent notifications to wrong user
 */
export function usePushNotifications(
  options: UsePushNotificationsOptions = {}
): UsePushNotificationsReturn {
  const { onNotificationTap } = options
  const { user } = useAuth()

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs for subscription cleanup
  const notificationListenerRef = useRef<EventSubscription | null>(null)
  const responseListenerRef = useRef<EventSubscription | null>(null)
  // Ref to avoid recreating AppState listener when token changes
  const expoPushTokenRef = useRef<string | null>(null)

  /**
   * Register for push notifications and get Expo push token
   */
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    logger.info('[usePushNotifications] Starting registration...')
    logger.info('[usePushNotifications] Device.isDevice:', Device.isDevice)

    // Only works on physical devices
    if (!Device.isDevice) {
      logger.warn('[usePushNotifications] Push notifications require a physical device')
      return null
    }

    try {
      // Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      logger.info('[usePushNotifications] Existing permission status:', existingStatus)
      let finalStatus = existingStatus

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
        logger.info('[usePushNotifications] Requested permission, status:', finalStatus)
      }

      if (finalStatus !== 'granted') {
        logger.info('[usePushNotifications] Permission not granted')
        return null
      }

      // Get project ID from app config
      logger.info('[usePushNotifications] expoConfig:', JSON.stringify(Constants.expoConfig?.extra))
      const projectId = Constants.expoConfig?.extra?.eas?.projectId

      if (!projectId) {
        logger.error('[usePushNotifications] Missing projectId in config')
        throw new Error('Missing Expo project ID in app.json')
      }

      logger.info('[usePushNotifications] Getting push token with projectId:', projectId)

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      })
      logger.info('[usePushNotifications] Got push token:', tokenData.data)

      // Set up Android notification channel
      // TODO(robustness): Wrap in try-catch - channel creation failure shouldn't block registration
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          PUSH_NOTIFICATION_CONFIG.channelId,
          {
            name: PUSH_NOTIFICATION_CONFIG.channelName,
            description: PUSH_NOTIFICATION_CONFIG.channelDescription,
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#8B5CF6', // Primary purple
          }
        )
      }

      return tokenData.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to register for push notifications')
      logger.error('[usePushNotifications] Registration failed:', error)
      throw error
    }
  }, [])

  /**
   * Save push token to Supabase
   */
  const savePushToken = useCallback(async (token: string): Promise<void> => {
    logger.info('[usePushNotifications] Saving token for user:', user?.id)
    if (!user?.id) {
      logger.warn('[usePushNotifications] Cannot save token: no user')
      return
    }

    logger.info('[usePushNotifications] Upserting push token to database...')
    const { error: saveError, data } = await supabase
      .from('user_notification_settings')
      .upsert(
        {
          user_id: user.id,
          push_token: token,
        },
        { onConflict: 'user_id' }
      )
      .select()

    if (saveError) {
      logger.error('[usePushNotifications] Failed to save push token:', saveError.message, saveError.details, saveError.hint)
      throw saveError
    }

    logger.info('[usePushNotifications] Push token saved successfully, result:', JSON.stringify(data))
  }, [user?.id])

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const rawData = response.notification.request.content.data

      // Runtime validation - ensure data is a valid object
      if (!rawData || typeof rawData !== 'object') {
        logger.warn('[usePushNotifications] Invalid notification data:', rawData)
        return
      }

      const data = rawData as NotificationData

      logger.info('[usePushNotifications] Notification tapped:', data)

      if (onNotificationTap) {
        onNotificationTap(data)
      }
    },
    [onNotificationTap]
  )

  /**
   * Public method to manually request permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const token = await registerForPushNotifications()
      if (token) {
        setExpoPushToken(token)
        await savePushToken(token)
        return true
      }
      return false
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Permission request failed')
      logger.error('[usePushNotifications] Permission request failed:', error)
      setError(error)
      return false
    }
  }, [registerForPushNotifications, savePushToken])

  // Register for push notifications when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      return
    }

    let isMounted = true

    const register = async () => {
      if (isRegistering) {
        return
      }

      setIsRegistering(true)
      setError(null)

      try {
        const token = await registerForPushNotifications()

        if (!isMounted) return

        if (token) {
          setExpoPushToken(token)
          await savePushToken(token)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Registration failed'))
        }
      } finally {
        if (isMounted) {
          setIsRegistering(false)
        }
      }
    }

    register()

    return () => {
      isMounted = false
    }
  // NOTE: isRegistering intentionally excluded from deps to prevent infinite loops
  // The guard check inside register() is sufficient to prevent duplicate registrations
  }, [user?.id, registerForPushNotifications, savePushToken])

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListenerRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.info('[usePushNotifications] Notification received in foreground:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
        })
      }
    )

    // Listener for notification taps
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    )

    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove()
      }
      if (responseListenerRef.current) {
        responseListenerRef.current.remove()
      }
    }
  }, [handleNotificationResponse])

  // Keep ref in sync with state to avoid recreating listener
  expoPushTokenRef.current = expoPushToken

  // Handle app state changes - refresh token when app becomes active
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Capture userId at start for null safety during async operations
      const currentUserId = user?.id
      const currentToken = expoPushTokenRef.current

      if (nextAppState === 'active' && currentUserId && currentToken) {
        // Token might have changed, re-register
        try {
          const token = await registerForPushNotifications()
          // Check user still logged in before saving
          if (token && token !== currentToken && user?.id === currentUserId) {
            setExpoPushToken(token)
            await savePushToken(token)
          }
        } catch (err) {
          logger.error('[usePushNotifications] Token refresh failed:', err)
          setError(err instanceof Error ? err : new Error('Token refresh failed'))
        }
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  // NOTE: expoPushToken excluded - using ref to avoid listener recreation
  }, [user?.id, registerForPushNotifications, savePushToken])

  return {
    expoPushToken,
    isRegistering,
    error,
    requestPermission,
  }
}
