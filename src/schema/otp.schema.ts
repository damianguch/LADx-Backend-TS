import { z } from 'zod';

// Define the schema for the request body
export const verifyOTPSchema = z.object({
  otp: z.string().min(4).max(6)
});
