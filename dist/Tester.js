"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const prop_types_1 = require("prop-types");
const react_native_1 = require("react-native");
const TestHookStore_1 = require("./TestHookStore");
const TestScope_1 = require("./TestScope");
const Expo_1 = require("expo/build/Expo");
// Public: Wrap your entire app in Tester to run tests against that app,
// interacting with registered components in your test cases via the Cavy
// helpers (defined in TestScope).
//
// This component wraps your app inside a <View> to facilitate
// re-rendering with a new key after each test case.
//
// store             - An instance of TestHookStore.
// specs             - An array of spec functions.
// waitTime          - An integer representing the time in milliseconds that
//                     the testing framework should wait for the function
//                     findComponent() to return the 'hooked' component.
// startDelay        - An integer representing the time in milliseconds before
//                     test execution begins.
// clearAsyncStorage - A boolean to determine whether to clear AsyncStorage
//                     between each test. Defaults to `false`.
// sendReport        - Boolean, set this to `true` to have Cavy try and
//                     send a report to cavy-cli. Set to `false` by
//                     default.
//
// Example
//
//   import { Tester, TestHookStore } from 'cavy';
//
//   import MyFeatureSpec from './specs/MyFeatureSpec';
//   import OtherFeatureSpec from './specs/OtherFeatureSpec';
//
//   const testHookStore = new TestHookStore();
//
//   export default class AppWrapper extends React.Component {
//     // ....
//     render() {
//       return (
//         <Tester specs={[MyFeatureSpec, OtherFeatureSpec]} store={testHookStore}>
//           <App />
//         </Tester>
//       );
//     }
//   }
class Tester extends react_1.Component {
    constructor(props, context) {
        super(props, context);
        this.setKeyboardState = (e) => {
            const { width, height } = react_native_1.Dimensions.get('window');
            if (e) {
                const keyboardHeight = height - e.endCoordinates.screenY;
                this.setState({
                    keyboardHeight,
                    viewPortSize: {
                        top: 0,
                        bottom: e.endCoordinates.screenY,
                        left: 0,
                        right: width,
                    },
                });
            }
        };
        const { width, height } = react_native_1.Dimensions.get('window');
        this.state = {
            key: Math.random(),
            keyboardHeight: 0,
            viewPortSize: {
                top: 0,
                left: 0,
                right: width,
                bottom: height,
            },
        };
        this.testHookStore = props.store;
        this.keyboardDidShowListener = react_native_1.Keyboard.addListener('keyboardDidShow', this.setKeyboardState);
        this.keyboardDidHideListener = react_native_1.Keyboard.addListener('keyboardDidHide', this.setKeyboardState);
    }
    getChildContext() {
        return {
            testHooks: this.testHookStore,
        };
    }
    componentDidMount() {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            if (__DEV__) {
                const initCavyConnection = (allowedRetries = 3) => {
                    const scriptURLSplit = react_native_1.NativeModules.SourceCode.scriptURL.split(':');
                    const URL = `${scriptURLSplit[0]}:${scriptURLSplit[1]}` + ':3030';
                    let ws = new WebSocket(URL);
                    console.log('Trying to establish connection to test server.');
                    ws.onerror = (err) => {
                        // @ts-ignore
                        console.log(err.message);
                    };
                    ws.onopen = () => {
                        console.log('Connected with test server!');
                        ws.send(JSON.stringify({
                            status: 'CONNECTED',
                            deviceName: Expo_1.Constants.deviceName,
                            installationId: Expo_1.Constants.installationId,
                        }));
                    };
                    ws.onmessage = (evt) => {
                        const data = JSON.parse(evt.data);
                        if (data.status === 'RUNTEST') {
                            this.runTests(data.filter);
                        }
                    };
                    ws.onclose = () => {
                        console.log('Disconnected from test server!');
                        setTimeout(() => {
                            allowedRetries
                                ? initCavyConnection(allowedRetries - 1)
                                : console.log('Could not establish connection to test server.');
                        }, 1000);
                    };
                };
                initCavyConnection(3);
            }
        });
    }
    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }
    runTests(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.props.beforeAll();
            const specs = [];
            let filterKeywords = [];
            if (filter)
                filterKeywords = filter.split(',');
            function addSpec(key, value) {
                value.givenName = key;
                specs.push(value);
            }
            this.props.specs.forEach((value, key) => {
                if (filterKeywords.length)
                    filterKeywords.forEach((filterKeyword) => {
                        if (key.indexOf(filterKeyword) !== -1)
                            addSpec(key, value);
                    });
                else
                    addSpec(key, value);
            });
            const scope = new TestScope_1.default(this, this.props.waitTime, this.props.startDelay, this.props.sendReport);
            for (var i = 0; i < specs.length; i++) {
                yield specs[i](scope);
            }
            yield scope.run();
            yield this.props.afterAll();
        });
    }
    reRender() {
        this.setState({ key: Math.random() });
    }
    clearAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.props.clearAsyncStorage) {
                try {
                    yield react_native_1.AsyncStorage.clear();
                }
                catch (e) {
                    console.warn('[Cavy] failed to clear AsyncStorage:', e);
                }
            }
        });
    }
    render() {
        return (<react_native_1.View key={this.state.key} style={{ flex: 1 }}>
        {react_1.Children.only(this.props.children)}
      </react_native_1.View>);
    }
}
Tester.defaultProps = {
    beforeAll: () => null,
    afterAll: () => null,
    sendReport: true,
    clearAsyncStorage: false,
    waitTime: 2000,
    startDelay: 0,
};
Tester.childContextTypes = {
    testHooks: prop_types_1.default.instanceOf(TestHookStore_1.default),
};
exports.default = Tester;
//# sourceMappingURL=Tester.js.map