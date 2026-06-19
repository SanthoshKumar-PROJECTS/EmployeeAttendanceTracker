/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import NotificationService from './src/services/NotificationService';

// Setup background notification handler (must be outside component)
NotificationService.setupBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
