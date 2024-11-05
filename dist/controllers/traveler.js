"use strict";
/**********************************************************************
 * Controller: Traveller Details controller
 * Description: Controller contains functions for traveller details.
 * Author: Damian Oguche
 * Date: 24-10-2024
 ***********************************************************************/
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
exports.UpdateTravelDetails = exports.TravelDetails = void 0;
const LogFile_1 = __importDefault(require("../models/LogFile"));
const traveller_1 = __importDefault(require("../models/traveller"));
const createLog_1 = __importDefault(require("../utils/createLog"));
const date_1 = __importDefault(require("../utils/date"));
const validator_1 = require("validator");
const travel_schema_1 = require("../schema/travel.schema");
const sanitize_1 = require("../utils/sanitize");
// @POST: Upload travel details
const TravelDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get user id from an authenticated token
    const userId = req.id;
    if (!userId) {
        res.status(400).json({
            status: 'E00',
            success: false,
            message: 'User ID is required for travel details submission.'
        });
    }
    // Validate request body against schema
    const { error, value } = travel_schema_1.travelDetailsSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        res.status(400).json({
            status: 'E00',
            success: false,
            message: 'Validation errors occurred',
            errors: error.details.map((err) => err.message)
        });
    }
    const sanitizedData = (0, sanitize_1.sanitizedTraveldetails)(value);
    try {
        const newTravelDetails = new traveller_1.default(sanitizedData);
        yield traveller_1.default.init();
        yield newTravelDetails.save();
        // Log the action
        yield (0, createLog_1.default)('Travel details saved Successfully!');
        const logEntry = new LogFile_1.default({
            ActivityName: `Travel details added by user ${userId}`,
            AddedOn: date_1.default
        });
        yield logEntry.save();
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Travel details saved Successfully!',
            travelDetails: sanitizedData
        });
    }
    catch (err) {
        (0, createLog_1.default)(`Error saving travel details: ${err.message}`);
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error: ' + err.message
        });
    }
});
exports.TravelDetails = TravelDetails;
// @PUT: Edit travel details
const UpdateTravelDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the user ID from the authenticated token
    const userId = req.id;
    if (!userId)
        res.status(400).json({
            status: 'E00',
            success: false,
            message: 'User ID is required for request update.'
        });
    try {
        // Find the existing request details
        // const existingTravelDetails = await Traveller.findOne({ userId });
        //update object (conditional spread operator)
        const travelDetails = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (req.body.flight_number && {
            flight_number: (0, validator_1.escape)(req.body.flight_number)
        })), (req.body.departure_city && {
            departure_city: (0, validator_1.escape)(req.body.departure_city)
        })), (req.body.destination_city && {
            destination_city: (0, validator_1.escape)(req.body.destination_city)
        })), (req.body.departure_date && {
            departure_date: new Date(req.body.departure_date)
        })), (req.body.destination_date && {
            destination_date: new Date(req.body.destination_date)
        })), (req.body.arrival_time && {
            arrival_time: (0, validator_1.escape)(req.body.arrival_time)
        })), (req.body.boarding_time && {
            boarding_time: (0, validator_1.escape)(req.body.boarding_time)
        })), (req.body.airline_name && {
            airline_name: (0, validator_1.escape)(req.body.airline_name)
        })), (req.body.item_weight && { item_weight: Number(req.body.item_weight) }));
        // Validate dates and number fields before proceeding
        if (isNaN(travelDetails.departure_date) ||
            isNaN(travelDetails.destination_date)) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Invalid date format for departure or destination date.'
            });
        }
        if (travelDetails.item_weight && isNaN(travelDetails.item_weight)) {
            res.status(400).json({
                status: 'E00',
                success: false,
                message: 'Item weight must be a number.'
            });
        }
        // Update the request details in the database
        // const id = existingTravelDetails.id;
        const updatedTravelDetails = yield traveller_1.default.findOneAndUpdate({ userId }, { $set: travelDetails }, { new: true });
        if (!updatedTravelDetails) {
            res.status(404).json({
                status: 'E00',
                success: false,
                message: `Travel details with user ID ${userId} not found.`
            });
        }
        // Log the update action
        yield (0, createLog_1.default)('Travel details updated successfully!');
        const logUpdate = new LogFile_1.default({
            ActivityName: `Travel details updated by user ${userId}`,
            AddedOn: date_1.default
        });
        yield logUpdate.save();
        res.status(200).json({
            status: '00',
            success: true,
            message: 'Travel details updated successfully!',
            updatedTravelDetails
        });
    }
    catch (err) {
        (0, createLog_1.default)(JSON.stringify({ Error: err.message }));
        res.status(500).json({
            status: 'E00',
            success: false,
            message: 'Internal Server Error: ' + err.message
        });
    }
});
exports.UpdateTravelDetails = UpdateTravelDetails;
