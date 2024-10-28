"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// userSchema outlines the structure of the documents to be stored
// in the Users collection.
const travellerSchema = new mongoose_1.Schema({
    flight_number: {
        type: String,
        required: true
    },
    departure_city: {
        type: String,
        required: true
    },
    destination_city: {
        type: String,
        required: true
    },
    departure_date: {
        type: Date,
        required: true
    },
    destination_date: {
        type: Date,
        required: true
    },
    arrival_time: {
        type: String,
        required: true
    },
    boarding_time: {
        type: String,
        required: true
    },
    airline_name: String,
    item_weight: Number,
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    } // Foreign key to User model
}, { timestamps: true });
const Traveller = mongoose_1.default.model('Traveller', travellerSchema);
exports.default = Traveller;
