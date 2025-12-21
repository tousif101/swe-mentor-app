import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const TAB_BAR_HORIZONTAL_PADDING = 24
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_HORIZONTAL_PADDING * 2

type TabConfig = {
  icon: keyof typeof Ionicons.glyphMap
  iconFocused: keyof typeof Ionicons.glyphMap
  label: string
  showBadge?: boolean
}

const tabConfig: Record<string, TabConfig> = {
  HomeTab: {
    icon: 'home-outline',
    iconFocused: 'home',
    label: 'Home',
  },
  JournalTab: {
    icon: 'book-outline',
    iconFocused: 'book',
    label: 'Journal',
    showBadge: true, // Pink dot indicator
  },
  InsightsTab: {
    icon: 'bulb-outline',
    iconFocused: 'bulb',
    label: 'Insights',
  },
  ProfileTab: {
    icon: 'person-outline',
    iconFocused: 'person',
    label: 'Profile',
  },
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const tabCount = state.routes.length
  const tabWidth = TAB_BAR_WIDTH / tabCount

  // Animated value for the bubble position
  const translateX = useRef(new Animated.Value(state.index * tabWidth)).current
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Animate bubble to new position with spring animation
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: state.index * tabWidth,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
        mass: 1,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
      ]),
    ]).start()
  }, [state.index, tabWidth, translateX, scaleAnim])

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          {/* Animated bubble indicator */}
          <Animated.View
            style={[
              styles.bubble,
              {
                width: tabWidth - 16,
                transform: [
                  { translateX: Animated.add(translateX, new Animated.Value(8)) },
                  { scale: scaleAnim },
                ],
              },
            ]}
          />

          {/* Tab items */}
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const config = tabConfig[route.name] || {
              icon: 'help-outline' as const,
              iconFocused: 'help' as const,
              label: route.name,
            }

            const isFocused = state.index === index

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params)
              }
            }

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              })
            }

            const testIdMap: Record<string, string> = {
              HomeTab: 'home-tab',
              JournalTab: 'journal-tab',
              InsightsTab: 'insights-tab',
              ProfileTab: 'profile-tab',
            }

            return (
              <TouchableOpacity
                key={route.key}
                testID={testIdMap[route.name] || route.name.toLowerCase()}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.tab, { width: tabWidth }]}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={isFocused ? config.iconFocused : config.icon}
                    size={22}
                    color={isFocused ? '#EC4899' : '#6B7280'}
                  />

                  {/* Badge indicator (pink dot) */}
                  {config.showBadge && !isFocused && (
                    <View style={styles.badge} />
                  )}
                </View>

                <Text
                  style={[
                    styles.label,
                    { color: isFocused ? '#EC4899' : '#6B7280' },
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabBarWrapper: {
    paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
    width: '100%',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 13, 35, 0.95)',
    borderRadius: 32,
    height: 64,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 8,
  },
  tabContent: {
    position: 'relative',
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
})
