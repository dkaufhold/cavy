import React from 'react';
import { ITestHookStore } from './types';
export default class TestHookStore implements ITestHookStore {
    hooks: {};
    add(identifier: string, component: React.Component): void;
    remove(identifier: string): void;
    get(identifier: string): React.Component;
}
//# sourceMappingURL=TestHookStore.d.ts.map