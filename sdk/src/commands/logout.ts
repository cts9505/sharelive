import { clearConfig } from '../config';

export function logoutCommand() {
  clearConfig();
  console.log('✅ Logged out successfully');
  console.log('💡 Run "sharelive login" to log back in\n');
}
