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
    const command = new SendEmailCommand(params);
    const response = await client.send(command);
    createAppLog('OTP sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = {
  sendOTPEmail
};
