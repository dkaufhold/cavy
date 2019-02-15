import Tester from './Tester';
import React from 'react';
import { SpecFunction, TestReport } from './types';
export default class TestScope {
    private component;
    private testHooks;
    private testCases;
    private waitTime;
    private startDelay;
    private shouldSendReport;
    private describeLabel?;
    constructor(component: Tester, waitTime: number, startDelay: number, shouldSendReport: boolean);
    run(): Promise<void>;
    runTests(): Promise<void>;
    static sendReport(report: TestReport): void;
    isFullyVisible(identifier: string): Promise<void>;
    findComponent(identifier: string): Promise<React.Component<{
        onChangeText?: any;
        onPress?: any;
    }>>;
    describe(label: string, f: SpecFunction): Promise<void>;
    it(label: string, f: SpecFunction): Promise<void>;
    fillIn(identifier: string, str: string): Promise<void>;
    press(identifier: any): Promise<void>;
    pause(time: any): Promise<{}>;
    exists(identifier: any): Promise<boolean>;
    notExists(identifier: any): Promise<boolean>;
}
//# sourceMappingURL=TestScope.d.ts.map