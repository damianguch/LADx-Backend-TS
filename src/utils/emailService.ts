import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import createAppLog from './createLog';

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY || '',
  secretAccessKey: process.env.AWS_SECRET_KEY || '',
  sessionToken: process.env.AWS_SESSION_TOKEN
};

const SES_Config = {
  credentials,
  region: process.env.AWS_REGION
};

const client = new SESClient(SES_Config);

export { client };

// Send OTP Email
export const sendOTPEmail = async (email: string, otp: string) => {
  const params = {
    Source: 'ladxofficial@gmail.com',
    Destination: {
      ToAddresses: [email]
    },

    Message: {
      Body: {
        Text: {
          Data: `Your OTP code is ${otp}`
        }
      },
      Subject: {
        Data: 'Your OTP Code'
      }
    }
  };

  try {
    // Send the created object to the AWS server
    const command = new SendEmailCommand(params);
    const response = await client.send(command);

    createAppLog('OTP sent successfully: ' + response);
    return response;
  } catch (error) {
    console.error('Error sending OTP:', (error as Error).message);
    createAppLog(
      JSON.stringify('Error sending OTP:' + (error as Error).message)
    );
  }
};

//Send Password Reset Email
export const passwordResetEmail = async (email: string, resetUrl: string) => {
  const params = {
    Source: 'ladxofficial@gmail.com',
    Destination: {
      ToAddresses: [email]
    },

    Message: {
      Body: {
        Text: {
          Data: `Your password reset link is ${resetUrl}`
        }
      },
      Subject: {
        Data: 'Your Password Reset Request'
      }
    }
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await client.send(command);
    createAppLog('Password Reset link sent successfully: ' + response);
  } catch (error) {
    console.error('Error sending reset link:', (error as Error).message);
    createAppLog(
      JSON.stringify('Error sending reset link:' + (error as Error).message)
    );
  }
};

// Send Reset confirmation email to user
export const ConfirmPasswordResetEmail = async (email: string) => {
  const params = {
    Source: 'ladxofficial@gmail.com',
    Destination: {
      ToAddresses: [email]
    },

    Message: {
      Body: {
        Text: {
          Data: `Your password reset was successful!.`
        }
      },
      Subject: {
        Data: 'Password Reset Successful'
      }
    }
  };

  try {
    const command = new SendEmailCommand(params);
    const res = await client.send(command);

    console.log(res);
    await createAppLog(JSON.stringify('Password reset Successfull'));
  } catch (error) {
    await createAppLog(JSON.stringify((error as Error).message));
    return console.log((error as Error).message);
  }
};
