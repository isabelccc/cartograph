/**
 * notification — notification.service (service)
 *
 * Default: structured log hook; swap for SES/SMS/push in production.
 */
export type NotificationService = {
  readonly send: (msg: { readonly channel: string; readonly body: string }) => Promise<void>;
};

export type NotificationServiceOptions = {
  readonly log?: (channel: string, body: string) => void;
};

export function createNotificationService(opts?: NotificationServiceOptions): NotificationService {
  return {
    async send(msg) {
      opts?.log?.(msg.channel, msg.body);
    },
  };
}
