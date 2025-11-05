import { toast as sonnerToast } from 'sonner';

type ToastOptions = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

export function toast({ title, description, actionLabel, onAction, duration = 4000 }: ToastOptions) {
  sonnerToast(title || '', {
    description,
    duration,
    action:
      actionLabel && onAction
        ? {
            label: actionLabel,
            onClick: onAction,
          }
        : undefined,
  });
}
