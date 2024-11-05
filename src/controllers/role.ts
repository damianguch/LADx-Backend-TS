import { Request, Response } from 'express';
import User, { IUser } from '../models/user';
import createAppLog from '../utils/createLog';
import logger from '../logger/logger';
import { roleSchema } from '../schema/role.schema';

interface RoleUpdateRequest extends Request {
  body: {
    role?: 'sender' | 'traveler';
  };
}

const UpdateRole = async (
  req: RoleUpdateRequest,
  res: Response
): Promise<void> => {
  // Validate request body using Zod
  const parseResult = roleSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errorMessage =
      parseResult.error.issues[0]?.message || 'Validation error';
    res.status(400).json({
      status: 'E00',
      success: false,
      message: errorMessage
    });

    // Info level logging
    logger.info(errorMessage, {
      timestamp: new Date().toISOString()
    });
    return;
  }

  const { role } = parseResult.data;
  const userId = req.id;

  try {
    // Update the user’s role in the database
    const user: IUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        status: 'E00',
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Info level logging
    logger.info('Role Updated Successfully', {
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      status: '00',
      success: true,
      message: 'Role updated successfully'
    });
  } catch (err: any) {
    createAppLog(`Error updating role: ${err.message}`);
    res.status(500).json({
      status: 'E00',
      success: false,
      message: `Error updating role: ${err.message}`
    });
  }
};

export { UpdateRole };
