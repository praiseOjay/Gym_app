/**
 * Notification Service for Overload AI.
 * Handles workout reminders, rest timer completion alerts, and permission management.
 * Compatible with mobile browsers, Android WebView / Capacitor, and PWAs.
 */

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
}

class NotificationService {
  private lastReminderDateKey = 'overload_last_reminder_date';

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return false;
    }
  }

  public sendNotification(title: string, options: NotificationOptions = {}): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const defaultOptions: NotificationOptions = {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        silent: false,
        ...options
      };

      // Prefer ServiceWorker showNotification if available for mobile/PWA background persistence
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, defaultOptions);
          })
          .catch(() => {
            new Notification(title, defaultOptions);
          });
        return true;
      }

      new Notification(title, defaultOptions);
      return true;
    } catch (err) {
      console.warn('Notification dispatch failed:', err);
      return false;
    }
  }

  public sendRestCompleteNotification(enabled?: boolean): boolean {
    if (enabled === false) return false;
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('overload_settings_v3');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.notificationsEnabled === false) return false;
        }
      }
    } catch {
      // Ignore storage errors
    }

    return this.sendNotification('Rest Complete! ⏱️', {
      body: 'Your rest period has ended. Time to conquer your next set!',
      tag: 'rest-timer-complete',
      ...({ renotify: true } as any)
    });
  }

  public async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        message: 'Notifications are not supported in this browser/device.'
      };
    }

    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return {
          success: false,
          message: 'Permission was not granted. Please allow notifications in device or browser settings.'
        };
      }
    }

    const sent = this.sendNotification('Overload AI Ready! ⚡', {
      body: 'Notifications are enabled! You will receive rest timer finish alerts and daily workout reminders.',
      tag: 'test-notification'
    });

    if (sent) {
      return { success: true, message: 'Test notification sent! Check your system notification tray.' };
    }
    return { success: false, message: 'Could not dispatch notification.' };
  }

  public checkAndSendDailyReminder(config: {
    notificationsEnabled?: boolean;
    notificationTime?: string;
    userName?: string;
  }): void {
    if (!config.notificationsEnabled) return;
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastSent = localStorage.getItem(this.lastReminderDateKey);
      if (lastSent === today) return;

      const [targetHour, targetMinute] = (config.notificationTime || '08:00')
        .split(':')
        .map((n) => parseInt(n, 10) || 0);

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Trigger if current time is at or past the scheduled reminder time
      if (
        currentHour > targetHour ||
        (currentHour === targetHour && currentMinute >= targetMinute)
      ) {
        const nameGreeting = config.userName && config.userName !== 'Athlete' ? `, ${config.userName}` : '';
        const sent = this.sendNotification(`Time to Train${nameGreeting}! 🏋️`, {
          body: 'Your hypertrophy split is ready. Step up and log your sets to maintain progressive overload!',
          tag: 'daily-workout-reminder'
        });

        if (sent) {
          localStorage.setItem(this.lastReminderDateKey, today);
        }
      }
    } catch (err) {
      console.warn('Daily reminder check error:', err);
    }
  }
}

export const notificationService = new NotificationService();
