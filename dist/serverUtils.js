"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expo_1 = require("expo/build/Expo");
const react_native_1 = require("react-native");
exports.messageCavyServer = (payload, status = 'DEFAULT') => {
    if (__DEV__) {
        const scriptURLSplit = react_native_1.NativeModules.SourceCode.scriptURL.split(':');
        const URL = `${scriptURLSplit[0]}:${scriptURLSplit[1]}` + ':3030';
        let ws = new WebSocket(URL);
        payload.status = status;
        payload.deviceName = Expo_1.Constants.deviceName;
        payload.installationId = Expo_1.Constants.installationId;
        ws.onopen = () => {
            ws.send(JSON.stringify(payload));
            ws.close();
        };
    }
};
//# sourceMappingURL=serverUtils.js.map