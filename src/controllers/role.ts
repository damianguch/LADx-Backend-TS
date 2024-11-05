import { Request, Response } from 'express';
import User, { IUser } from '../models/user';
import createAppLog from '../utils/createLog';
import logger from '../logger/logger';

// Define a specific type for the request body
interface RoleUpdateRequest extends Request {
  body: {
    role: 'sender' | 'traveler';
  };
}

const UpdateRole = async (
  req: RoleUpdateRequest,
  res: Response
): Promise<void> => {
  const { role } = req.body;
  const userId = req.id;

  // Validate that the role is valid
  if (!['sender', 'traveler'].includes(role)) {
    res.status(400).json({
      status: 'E00',
      success: false,
      message: 'Invalid role selected'
    });
    return;
  }

  try {
    // Update the user’s role in the database
    const user: IUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );
    if (!user) {
      res
        .status(404)
        .json({ status: 'E00', success: false, message: 'User not found' });
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
