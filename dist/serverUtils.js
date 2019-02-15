import { Constants } from 'expo/build/Expo';
import { NativeModules } from 'react-native';
export const messageCavyServer = (payload, status = 'DEFAULT') => {
    if (__DEV__) {
        const scriptURLSplit = NativeModules.SourceCode.scriptURL.split(':');
        const URL = `${scriptURLSplit[0]}:${scriptURLSplit[1]}` + ':3030';
        let ws = new WebSocket(URL);
        payload.status = status;
        payload.deviceName = Constants.deviceName;
        payload.installationId = Constants.installationId;
        ws.onopen = () => {
            ws.send(JSON.stringify(payload));
            ws.close();
        };
    }
};
//# sourceMappingURL=serverUtils.js.map