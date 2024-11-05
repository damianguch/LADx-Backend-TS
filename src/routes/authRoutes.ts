import { Login, SignUp, verifyOTP, Logout } from '../controllers/auth';
import { ForgotPassword, ResetPassword } from '../controllers/forgotPassword';
import { validateUserSignup } from '../schema/user.schema';
import { Router } from 'express';

const authRouter = Router();

authRouter.post('/signup', validateUserSignup, SignUp);
authRouter.post('/verify-otp', verifyOTP);

//Use multer to handle multipart/form-data requests.
authRouter.post('/login', Login);

authRouter.post('/logout', Logout);
authRouter.post('/forgot-password', ForgotPassword);
authRouter.put('/reset-password', ResetPassword);

export { authRouter };
