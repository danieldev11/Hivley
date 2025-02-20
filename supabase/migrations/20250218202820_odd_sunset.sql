-- Create email templates table
CREATE TABLE IF NOT EXISTS auth.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL UNIQUE,
  subject text NOT NULL,
  content_html text NOT NULL,
  content_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert or update confirmation email template
INSERT INTO auth.email_templates (
  template_type,
  subject,
  content_html,
  content_text
)
VALUES (
  'confirm_signup',
  'Verify your Hivley account',
  '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;"><div style="max-width: 600px; margin: 0 auto; padding: 20px;"><h2 style="color: #1A2B4C; margin-bottom: 20px;">Verify Your Email</h2><p>Thank you for signing up for Hivley! Please verify your email address by clicking the button below:</p><p style="text-align: center; margin: 30px 0;"><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #FF9F00; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a></p><p>If you did not create this account, please ignore this email.</p><p>Best regards,<br>The Hivley Team</p></div></body></html>',
  'Thank you for signing up for Hivley! Please verify your email address by clicking this link: {{ .ConfirmationURL }}\n\nIf you did not create this account, please ignore this email.'
)
ON CONFLICT (template_type) 
DO UPDATE SET
  subject = EXCLUDED.subject,
  content_html = EXCLUDED.content_html,
  content_text = EXCLUDED.content_text,
  updated_at = now();

-- Create function to handle email settings
CREATE OR REPLACE FUNCTION auth.handle_email_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update auth settings to enable email verification
  UPDATE auth.users SET
    raw_app_meta_data = jsonb_set(
      jsonb_set(
        coalesce(raw_app_meta_data, '{}'::jsonb),
        '{email_verification_required}',
        'true'
      ),
      '{email_confirm_required}',
      'true'
    )
  WHERE raw_app_meta_data->>'email_verification_required' IS NULL
  OR raw_app_meta_data->>'email_confirm_required' IS NULL;
END;
$$;

-- Run the function to update existing users
SELECT auth.handle_email_settings();