const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { createAppLog } = require('./createLog');

const SES_Config = {
  credentials: {
    accessKey: process.env.AWS_ACCESS_KEY,
    secretKey: process.env.AWS_SECRET_KEY
  },
  region: process.env.AWS_REGION
};

const client = new SESClient(SES_Config);

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
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

    createAppLog('OTP sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    createAppLog(JSON.stringify('Error sending OTP:' + error.message));
  }
};

//Send Password Reset Email
const passwordResetEmail = async (email, resetUrl) => {
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
    createAppLog('Password Reset link sent successfully:', response);
  } catch (error) {
    console.error('Error sending reset link:', error.message);
    createAppLog(JSON.stringify('Error sending reset link:' + error.message));
  }
};

// Send Reset confirmation email to user
const ConfirmPasswordResetEmail = async (email) => {
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
    await createAppLog(JSON.stringify(error.message));
    return console.log(error.message);
  }
};

module.exports = {
  sendOTPEmail,
  passwordResetEmail,
  ConfirmPasswordResetEmail
};
