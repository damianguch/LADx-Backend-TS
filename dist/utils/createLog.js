"use strict";
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Function to create logs
function createAppLog(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const parentFolderPath = 'logs';
        const today = new Date();
        const formattedDate = today.toISOString().slice(0, 10);
        const folderPath = path_1.default.join(parentFolderPath, formattedDate);
        fs_1.default.mkdir(folderPath, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating folder:', err);
            }
            else {
                // Create the log file inside the folder
                const logFilePath = path_1.default.join(folderPath, 'log.txt');
                const logData = `Time logged: (${today.toLocaleTimeString()}):-  Message: ${data}\n`;
                fs_1.default.appendFile(logFilePath, logData, { flag: 'a' }, (err) => {
                    if (err) {
                        console.error('Error writing to log file:', err);
                    }
                    else {
                        //console.log('Log file written successfully:', logFilePath);
                    }
                });
            }
        });
    });
}
exports.default = createAppLog;
