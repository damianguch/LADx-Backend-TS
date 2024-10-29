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
exports.Sender = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// userSchema outlines the structure of the documents to be stored
// in the Users collection.
const senderSchema = new mongoose_1.Schema({
    package_details: {
        type: String,
        required: true
    },
    package_name: {
        type: String,
        required: true
    },
    item_description: {
        type: String,
        required: true
    },
    package_value: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    address_from: {
        type: String,
        required: true
    },
    address_to: {
        type: String,
        required: true
    },
    reciever_name: {
        type: String,
        required: true
    },
    reciever_phone_number: {
        type: Number,
        required: true
    },
    requestItemsImageUrls: {
        type: [String],
        required: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    } // Foreign key to User model
}, { timestamps: true });
const Sender = mongoose_1.default.model('Sender', senderSchema);
exports.Sender = Sender;
