import React from 'react';
import TestHookStore from './TestHookStore';
export interface Props {
    beforeAll: () => void;
    afterAll: () => void;
    waitTime: number;
    startDelay: number;
    sendReport: boolean;
    specs: Map<string, Function>;
    clearAsyncStorage: boolean;
}
export interface State {
    key: number;
    keyboardHeight: number;
    viewPortSize: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    };
}
export default class Tester extends React.Component<Props, State> {
    testHookStore: TestHookStore;
    private keyboardDidShowListener;
    private keyboardDidHideListener;
    getChildContext(): {
        testHooks: TestHookStore;
    };
    static defaultProps: {
        beforeAll: () => any;
        afterAll: () => any;
        sendReport: boolean;
        clearAsyncStorage: boolean;
        waitTime: number;
        startDelay: number;
    };
    static childContextTypes: {
        testHooks: any;
    };
    constructor(props: any, context: any);
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    setKeyboardState: (e: any) => void;
    runTests(filter?: string): Promise<void>;
    reRender(): void;
    clearAsync(): Promise<void>;
    render(): any;
}
//# sourceMappingURL=Tester.d.ts.map