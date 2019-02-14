// Public: A TestHookStore stores flattened references to UI components in your
// app that you want to interact with as part of your integration tests.
//
// See Tester.js for an example of instantiating a TestHookStore for use with
// a `<Tester />` component.

import React from 'react'
import { ITestHookStore } from './types'

export default class TestHookStore implements ITestHookStore {
  hooks = {}

  // Internal: Add a new component into the store. If there is an existing
  // component with that identifier, replace it.
  //
  // identifier - String, a unique identifier for this component. To help
  //              separate out hooked components, use dot namespaces e.g.
  //              'MyScene.mycomponent'.
  // component  - Component returned by React `ref` function.
  //
  // Returns undefined.
  add(identifier: string, component: React.Component): void {
    this.hooks[identifier] = component
  }

  // Internal: Remove a component from the store.
  //
  // Returns undefined.
  remove(identifier: string): void {
    delete this.hooks[identifier]
  }

  // Internal: Fetch a component from the store.
  //
  // Returns the component corresponding to the provided identifier, or
  // undefined if it has not been added.
  get(identifier: string): React.Component  {
    return this.hooks[identifier]
  }
}
