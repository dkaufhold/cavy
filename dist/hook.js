"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const prop_types_1 = require("prop-types");
const hoist_non_react_statics_1 = require("hoist-non-react-statics");
const TestHookStore_1 = require("./TestHookStore");
// Public: Higher-order React component to factilitate adding hooks to the
// global test hook store.
//
// WrappedComponent - Component to be wrapped, will be passed an initial
//                    property called 'generateTestHook' which is a function
//                    generator that will add a component to the test hook
//                    store.
//
// Example
//
//   import { hook } from 'cavy';
//
//   class MyComponent extends React.Component {
//     // ....
//   }
//
//   const TestableMyComponent = hook(MyComponent);
//   export default TestableMyComponent;
//
// Returns the new component.
function hook(WrappedComponent) {
    const wrapperComponent = class extends react_1.default.Component {
        constructor(props, context) {
            super(props, context);
            this.generateTestHook = this.generateTestHook.bind(this);
        }
        // Public: Call `this.props.generateTestHook` in a ref within your
        // component to add it to the test hook store for later use in a spec.
        //
        // React calls this function twice during the render lifecycle; once to
        // 'unset' the ref, and once to set it.
        //
        // identifier - String, the key the component will be stored under in the
        //              test hook store.
        // f          - Your own ref generating function (optional).
        //
        // Examples
        //
        //   <TextInput
        //     ref={this.props.generateTestHook('MyComponent.textinput', (c) => this.textInput = c)}
        //     // ...
        //   />
        //
        //   <Button
        //     ref={this.props.generateTestHook('MyComponent.button')}
        //     title="Press me!"
        //   />
        //
        // Returns the ref-generating anonymous function which will be called by
        // React.
        generateTestHook(identifier, f) {
            return (component) => {
                if (!this.context.testHooks) {
                    f(component);
                    return;
                }
                if (component) {
                    this.context.testHooks.add(identifier, component);
                }
                else {
                    this.context.testHooks.remove(identifier, component);
                }
                f(component);
            };
        }
        render() {
            return (
            // @ts-ignore
            <WrappedComponent generateTestHook={this.generateTestHook} {...this.props}/>);
        }
    };
    // @ts-ignore TODO type all the context stuff
    wrapperComponent.contextTypes = {
        testHooks: prop_types_1.default.instanceOf(TestHookStore_1.default),
    };
    // @ts-ignore
    return hoist_non_react_statics_1.default(wrapperComponent, WrappedComponent);
}
exports.default = hook;
//# sourceMappingURL=hook.js.map