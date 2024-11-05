import { z } from 'zod';

// Define Zod schema for role validation
const roleSchema = z.object({
  role: z.enum(['sender', 'traveler'], {
    required_error: 'Role is required',
    invalid_type_error: "Role must be either 'sender' or 'traveler'"
  })
});

export { roleSchema };
