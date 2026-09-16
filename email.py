import secrets
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def generate_verification_code():
    """Generates a secure random single-digit integer from 1 to 9."""
    # secrets.choice ensures cryptographic randomness
    return secrets.choice(range(1, 10))

def send_verification_email(user_email, code):
    """Sends the generated verification code to the user's real email address."""
    # Configuration - Replace with your actual email data or environment variables
    sender_email = "your_gmail_address@gmail.com"
    # DO NOT use your real password here; use a generated 16-character App Password
    sender_app_password = "your_google_app_password"

    # Set up SMTP Server for Gmail
    smtp_server = "://gmail.com"
    smtp_port = 587  # TLS Port

    # Construct the email content    npm.cmd run dev
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = user_email
    message["Subject"] = "Your Secure Verification Code"

    # Clear instructions and single digit inclusion
    body = f"""
    Hello,

    Your one-time verification code is: {code}

    Please enter this single-digit code to verify your identity. If you did not request this, please ignore this email.

    Best regards,
    Your App Security Team
    """
    message.attach(MIMEText(body, "plain"))

    try:
        # Establish a secure connection to the mail server
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Upgrade connection to secure encrypted TLS

        # Log in and dispatch the mail
        server.login(sender_email, sender_app_password)
        server.sendmail(sender_email, user_email, message.as_string())
        print(f" Verification email successfully sent to {user_email}")

    except Exception as e:
        print(f"❌ Failed to send email. Error: {e}")

    finally:
        # Gracefully sever the server connection
        server.quit()

# --- Execution Example ---
if __name__ == "__main__":
    # 1. Generate the varying 1 to 9 single-digit code
    verification_code = generate_verification_code()
    print(f"Generated Code: {verification_code}")

    # 2. Define the recipient's real email address
    target_user_email = "recipient_user@example.com"

    # 3. Fire off the email
    send_verification_email(target_user_email, verification_code)