import { Request, Response } from "express";
import { sendJSONresponse } from "../common/Utils";
import { Device } from "../models/DeviceModel";
import * as winston from "winston";
import { Error } from "mongoose";
import { ISavedDevice } from "./Interfaces/IPusherController"

export class Pusher {
    register = (req: Request, res: Response) => {
        const wallets = [...(new Set(req.body.wallets.map((wallet: string) => wallet.toLowerCase())))];
        const inputPreferences = req.body.preferences || {};
        const preferences = {
            isAirdrop: inputPreferences.isAirdrop || false
        }
        const type: string = req.body.type || ""
        const deviceID: string = req.body.deviceID
        const token: string = req.body.token
        const updateOptions = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
        const updatesParams = {
            deviceID,
            wallets,
            token,
            preferences,
            type
        }

        try {
            if (deviceID && token) {
                Device.findOneAndUpdate({deviceID}, updatesParams, updateOptions).then(registeredDevice => {
                    this.sendOnRegister(res, registeredDevice)
                })
            }
            else if (token && !deviceID && type === "android") {
                Device.findOneAndUpdate({token}, updatesParams, updateOptions).then(registeredDevice => {
                    this.sendOnRegister(res, registeredDevice)
                })
            } else {
                throw new TypeError()
            }
        } catch (error) {
            winston.error(`Failed to save device `, error);
            sendJSONresponse(res, 500, {
                status: 500,
                message: "Failed to save device, check if token, deviceID, or type specified correctly",
                error,
              });
        }
    }

    unregister(req: Request, res: Response): void {
        Device.findOneAndRemove({
            deviceID: req.body.deviceID
        }).then((savedDevice: ISavedDevice) => {
            sendJSONresponse(res, 200, {
                status: true,
                message: "Successfully unregistered",
                response: savedDevice,
            })
        }).catch((error: Error) => {
            winston.info("Error unregistering ", error);
            sendJSONresponse(res, 500, {
                status: false,
                message: "Failed to remove",
                error,
            })
        });
    }

    private sendOnRegister(res: Response, registeredDevice) {
        sendJSONresponse(res, 200, {
            status: 200,
            message: "Successfully saved",
            response: registeredDevice,
        });
    }
}
