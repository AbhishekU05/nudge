export type ReminderRow = {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_email: string;
  amount_owed: number;
  custom_message: string | null;
  reminder_frequency_days: number;
  next_send_at: string;
  last_sent_at: string | null;
  active: boolean;
  unsubscribed: boolean;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
};

