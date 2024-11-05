import { z } from 'zod';

export const roleSchema = z.object({
  role: z
    .string()
    .min(1, { message: 'Role is required' })
    .refine((val) => val === 'sender' || val === 'traveler', {
      message: 'Invalid role selected'
    })
});
