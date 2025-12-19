/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/mobile.app',
      build:
        'xcodebuild -workspace ios/mobile.xcworkspace -scheme mobile -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/mobile.app',
      build:
        'xcodebuild -workspace ios/mobile.xcworkspace -scheme mobile -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16 Pro',
      },
    },
  },
  configurations: {
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
  },
}
