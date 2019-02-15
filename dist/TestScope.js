// Internal: Wrapper around an app being tested, and a bunch of test cases.
//
// The TestScope also includes all the functions available when writing your
// spec files.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { messageCavyServer } from './serverUtils';
class ComponentNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ComponentNotFoundError';
    }
}
class TestFailedError extends Error {
    constructor(message = 'Test was not successful.') {
        super(message);
        this.name = 'TestFailedError';
    }
}
class NoNativeComponentError extends Error {
    constructor(message = "Component needs access to a native component's measure method.") {
        super(message);
        this.name = 'NoNativeComponentError';
    }
}
export default class TestScope {
    constructor(component, waitTime, startDelay, shouldSendReport) {
        this.component = component;
        this.testHooks = component.testHookStore;
        this.testCases = [];
        this.waitTime = waitTime;
        this.startDelay = startDelay;
        this.shouldSendReport = shouldSendReport;
        this.run.bind(this);
    }
    // Internal: Start tests after optional delay time.
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.startDelay) {
                yield this.pause(this.startDelay);
            }
            yield this.runTests();
        });
    }
    // Internal: Synchronously run each test case one after the other, outputting
    // on the console if the test case passes or fails, and adding to testResult
    // array for reporting purposes.
    // Resets the app after each test case by changing the component key to force
    // React to re-render the entire component tree.
    runTests() {
        return __awaiter(this, void 0, void 0, function* () {
            let testResults = [];
            let errorCount = 0;
            const start = new Date().getTime();
            console.log(`Cavy test suite started at ${start}.`);
            for (let i = 0; i < this.testCases.length; i++) {
                let { description, f } = this.testCases[i];
                try {
                    yield f.call(this);
                    let successMsg = `${description}  ✅`;
                    console.log(successMsg);
                    testResults.push({ message: successMsg, passed: true });
                }
                catch (e) {
                    let errorMsg = `${description}  ❌\n   ${e.message}`;
                    console.warn(errorMsg);
                    testResults.push({ message: errorMsg, passed: false });
                    errorCount += 1;
                }
                yield this.component.clearAsync();
                this.component.reRender();
            }
            const stop = new Date().getTime();
            const duration = (stop - start) / 1000;
            console.log(`Cavy test suite stopped at ${stop}, duration: ${duration} seconds.`);
            const report = {
                results: testResults,
                errorCount: errorCount,
                duration: duration,
            };
            if (this.shouldSendReport) {
                yield TestScope.sendReport(report);
            }
        });
    }
    static sendReport(report) {
        messageCavyServer(report, 'REPORT');
    }
    isFullyVisible(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const component = yield this.findComponent(identifier);
            let measurements;
            // @ts-ignore
            if (!component.measure)
                throw new NoNativeComponentError(`Component ${identifier} needs access to a native component's measure method.`);
            else
                measurements = yield new Promise((resolve) => 
                // @ts-ignore
                component.measure((x, y, width, height, pageX, pageY) => resolve({ x, y, width, height, pageX, pageY })));
            const { viewPortSize } = this.component.state;
            const objectSize = {
                left: measurements.pageX,
                right: measurements.pageX + measurements.width,
                top: measurements.pageY,
                bottom: measurements.pageY + measurements.height,
            };
            const isVisible = viewPortSize.top <= objectSize.top &&
                viewPortSize.right >= objectSize.right &&
                viewPortSize.left <= objectSize.left &&
                viewPortSize.bottom >= objectSize.bottom;
            if (!isVisible)
                throw new TestFailedError(`Component ${identifier} was not fully visible.`);
        });
    }
    // Public: Find a component by its test hook identifier. Waits
    // this.waitTime for the component to appear before abandoning.
    //
    // Usually, you'll want to use `exists` instead.
    //
    // identifier - String, component identifier registered in the test hook store
    //              via `generateTestHook`.
    //
    // Example
    //
    //   import { assert } from 'assert';
    //   const c = await spec.findComponent('MyScene.myComponent');
    //   assert(c, 'Component is missing');
    //
    // Returns a promise; use `await` when calling this function. Resolves the
    // promise if the component is found, rejects the promise after
    // this.waitTime if the component is never found in the test hook
    // store.
    findComponent(identifier) {
        return new Promise((resolve, reject) => {
            let startTime = Date.now();
            let loop = setInterval(() => {
                const component = this.testHooks.get(identifier);
                if (component) {
                    clearInterval(loop);
                    return resolve(component);
                }
                else {
                    if (Date.now() - startTime >= this.waitTime) {
                        reject(new ComponentNotFoundError(`Could not find component with identifier ${identifier}`));
                        clearInterval(loop);
                    }
                }
            }, 100);
        });
    }
    // Public: Build up a group of test cases.
    //
    // label - Label for these test cases.
    // f     - Callback function containing your tests cases defined with `it`.
    //
    // Example
    //
    //   // specs/MyFeatureSpec.js
    //   export default function(spec) {
    //     spec.describe('My Scene', function() {
    //
    //       spec.it('Has a component', async function() {
    //         await spec.exists('MyScene.myComponent');
    //       });
    //
    //     });
    //   }
    //
    // Returns undefined.
    describe(label, f) {
        return __awaiter(this, void 0, void 0, function* () {
            this.describeLabel = label;
            yield f.call(this);
        });
    }
    // Public: Define a test case.
    //
    // label - Label for this test case. This is combined with the label from
    //         `describe` when Cavy outputs to the console.
    // f     - The test case.
    //
    // See example above.
    it(label, f) {
        return __awaiter(this, void 0, void 0, function* () {
            const description = `${this.describeLabel}: ${label}`;
            this.testCases.push({ description, f });
        });
    }
    // Public: Fill in a `TextInput`-compatible component with a string value.
    // Your component should respond to the property `onChangeText`.
    //
    // identifier - Identifier for the component.
    // str        - String to fill in.
    //
    // Returns a promise, use await when calling this function. Promise will be
    // rejected if the component is not found.
    fillIn(identifier, str) {
        return __awaiter(this, void 0, void 0, function* () {
            const component = yield this.findComponent(identifier);
            component.props.onChangeText(str);
        });
    }
    // Public: 'Press' a component (e.g. a `<Button />`).
    // Your component should respond to the property `onPress`.
    //
    // identifier - Identifier for the component.
    //
    // Returns a promise, use await when calling this function. Promise will be
    // rejected if the component is not found.
    press(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const component = yield this.findComponent(identifier);
            component.props.onPress();
        });
    }
    // Public: Pause the test for a specified length of time, perhaps to allow
    // time for a request response to be received.
    //
    // time - Integer length of time to pause for (in milliseconds).
    //
    // Returns a promise, use await when calling this function.
    pause(time) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                setTimeout(function () {
                    resolve();
                }, time);
            });
        });
    }
    // Public: Check a component exists.
    //
    // identifier - Identifier for the component.
    //
    // Returns a promise, use await when calling this function. Promise will be
    // rejected if component is not found, otherwise will be resolved with
    // `true`.
    exists(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const component = yield this.findComponent(identifier);
            return !!component;
        });
    }
    // Public: Check for the absence of a component. Will potentially halt your
    // test for your maximum wait time.
    //
    // identifier - Identifier for the component.
    notExists(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.findComponent(identifier);
            }
            catch (e) {
                if (e.name === 'ComponentNotFoundError') {
                    return true;
                }
                throw e;
            }
            throw new Error(`Component with identifier ${identifier} was present`);
        });
    }
}
//# sourceMappingURL=TestScope.js.map