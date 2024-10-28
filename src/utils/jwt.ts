import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Response, Request, NextFunction } from 'express';

interface Payload {
  // Define the properties of the payload here:
  email?: string;
  id?: string;
}

declare module 'express-serve-static-core' {
  // Extend the Request type to include the user property
  interface Request {
    user?: string | JwtPayload;
    id?: string;
  }
}

// Ensure a strong secret key in production
const SECRET_KEY = process.env.JWT_SECRET_KEY as string;

if (!SECRET_KEY) {
  throw new Error('JWT_SECRET_KEY not defined in environment variables');
}

// Function to generate a JWT token
export function generateToken(payload: Payload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}

// Authentication middleware
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check header or cookie for token
  const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

  if (token) {
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!,
      (err: jwt.VerifyErrors | null, user: string | JwtPayload | undefined) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
      }
    );
  } else {
    res.status(401).json({ message: 'Authorization token required' });
  }
};

// Middleware function to verify JWT tokens
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  let tokenArr = token.split(' ');

  jwt.verify(tokenArr[1], process.env.JWT_SECRET_KEY!, (err) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    //req.user = decoded;
    next();
  });
}

// Middleware to check JWT token in cookie
export const verifyTokenFromCookie = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ message: 'Unauthorized Please login!' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);
    // Check if decoded is of type JwtPayload and access `id` if so
    const id = (decoded as JwtPayload).id;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'E00',
        success: false,
        message: 'Invalid user ID format'
      });
    }

    req.id = id; // Attach user info to the request
    next();
  } catch (error) {
    res.status(403).json({ message: 'Forbidden!' });
  }
};
