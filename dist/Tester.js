var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';
import { Keyboard, AsyncStorage, Dimensions, NativeModules, View, } from 'react-native';
import TestHookStore from './TestHookStore';
import TestScope from './TestScope';
import { Constants } from 'expo/build/Expo';
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
export default class Tester extends Component {
    constructor(props, context) {
        super(props, context);
        this.setKeyboardState = (e) => {
            const { width, height } = Dimensions.get('window');
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
        const { width, height } = Dimensions.get('window');
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
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.setKeyboardState);
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.setKeyboardState);
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
                    const scriptURLSplit = NativeModules.SourceCode.scriptURL.split(':');
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
                            deviceName: Constants.deviceName,
                            installationId: Constants.installationId,
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
            const scope = new TestScope(this, this.props.waitTime, this.props.startDelay, this.props.sendReport);
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
                    yield AsyncStorage.clear();
                }
                catch (e) {
                    console.warn('[Cavy] failed to clear AsyncStorage:', e);
                }
            }
        });
    }
    render() {
        return (<View key={this.state.key} style={{ flex: 1 }}>
        {Children.only(this.props.children)}
      </View>);
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
    testHooks: PropTypes.instanceOf(TestHookStore),
};
//# sourceMappingURL=Tester.js.map