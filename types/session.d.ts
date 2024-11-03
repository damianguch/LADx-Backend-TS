import 'express-session';

// Augment express-session with a custom SessionData object
declare module 'express-session' {
  interface SessionData {
    email: string;
    userId: string;
    otpData: {
      hashedOTP: string;
      expiresAt: number;
    };
    tempUser: {
      fullname: string;
      email: string;
      phone: string | null;
      country: string;
      state: string;
      password: string;
    };
  }
}
