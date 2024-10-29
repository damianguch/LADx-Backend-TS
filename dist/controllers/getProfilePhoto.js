"use strict";
/**********************************************************************
 * Controller: Get Profile Photo controller
 * Description: Controller contains functions for profile photo update.
 * Author: Damian Oguche
 * Date: 14-10-2024
 **********************************************************************/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProfilePhoto = void 0;
const user_1 = __importDefault(require("../models/user"));
const createLog_1 = __importDefault(require("../utils/createLog"));
// GET: Retrieve Profile Photo
const GetProfilePhoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.id;
    try {
        // Automatically casts id to an ObjectId
        const user = yield user_1.default.findById(id);
        if (!user || !user.profilePicUrl) {
            yield (0, createLog_1.default)('User profile photo not found!');
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'User profile Photo not found!'
            });
        }
        yield (0, createLog_1.default)('Profile Photo Retrieved Successfully!');
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Profile Photo Retrieved Successfully!',
            profilePic: user.profilePicUrl
        });
    }
    catch (err) {
        yield (0, createLog_1.default)(err.message);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: err.message
        });
    }
});
exports.GetProfilePhoto = GetProfilePhoto;
