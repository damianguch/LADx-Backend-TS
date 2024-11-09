import {
  Login,
  SignUp,
  verifyOTP,
  Logout,
  resendOTP,
  isAuthenticated
} from '../controllers/auth';
import { ForgotPassword, ResetPassword } from '../controllers/forgotPassword';
import { validateUserSignup } from '../schema/user.schema';
import { Router } from 'express';
import { verifyTokenFromCookie } from '../utils/jwt';

const authRouter = Router();

authRouter.post('/signup', validateUserSignup, SignUp);
authRouter.post('/verify-otp', verifyOTP);
authRouter.post('/resend-otp', resendOTP);

//Use multer to handle multipart/form-data requests.
authRouter.post('/login', Login);

authRouter.post('/logout', Logout);
authRouter.post('/forgot-password', ForgotPassword);
authRouter.put('/reset-password', ResetPassword);

authRouter.get('/check-auth', verifyTokenFromCookie, isAuthenticated);

export { authRouter };
