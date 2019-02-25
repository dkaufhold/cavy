# Cavy(forked)

**Cavy** is a cross-platform integration test framework for React Native, by
[Pixie Labs](http://pixielabs.io). You can get it [HERE](https://github.com/pixielabs/cavy/)  
**Cavy(forked)** tries to build on top of the great work of the original authors
by adding to it or rebuilding original parts.

This README covers installing and setting up Cavy(forked), writing Cavy(forked) tests and FAQs.
For information on how to use Cavy(forked)'s **command line interface**, check out
[cavy-forked-cli][cli].

## About this fork

This fork contains major backwards-incompatible changes. It's meant to work around
some limitations of the original cavy in regards to certain project requirements.
Maybe some of the ideas outlined in this fork might find it back to the
original, but it's very likely, that it will remain a forever-fork. Most of the changes are to make it match the rewrites of the cavy-cli
which you can find in its [own fork](https://github.com/dkaufhold/cavy-forked-cli/).

One of the advantages of this fork is, that it's 100% compatible to be used with expo.
  
Note: Installing from NPM will the original, not this fork.

## Known incompatibilities

* Expo is required (which is default if you have a fresh, recent React Native project created with [CRNA][crna])
* Requires [fork of CLI](https://github.com/dkaufhold/cavy-forked-cli/)

## Table of Contents
- [How does it work?](#how-does-it-work)
  - [CLI and continuous integration](#cli-and-continuous-integration)
  - [Where does it fit in?](#where-does-it-fit-in)
- [Installation](#installation)
- [Usage](#usage)
  - [1. Set up the Tester](#1-set-up-the-tester)
  - [2. Hook up components](#2-hook-up-components)
  - [3. Write test cases](#3-write-test-cases)
  - [4. Running Tests](#4-running-tests)
  - [Apps that use native code](#apps-that-use-native-code)
- [Available spec helpers](#available-spec-helpers)
- [Writing your own spec helpers](#writing-your-own-spec-helpers)
- [FAQs](#faqs)
- [Contributing](#contributing)
- [Roadmap](#roadmap)

## How does it work?

Cavy(forked) (ab)uses React `ref` generating functions to give you the ability to refer
to, and simulate actions upon, deeply nested components within your
application. Unlike a tool like [enzyme](https://github.com/airbnb/enzyme)
which uses a simulated renderer, Cavy(forked) runs within your live application as it
is running on a host device (e.g. your Android or iOS simulator).

### CLI and continuous integration

By default, Cavy(forked) outputs test results to the background test server via
WebSocket connection. 
The test server is required in the background to remote control the tester that
is running inside your codebase.
In contrast to the original cavy, cavy (forked) will not run tests automatically
as soon as the simulator or device starts the app.

CI integration is not yet tested in this fork but will be supported in the future

### Where does it fit in?

Cavy(forked) was built because, at the time of writing, React Native had only a handful
of testing approaches available:

1. Unit testing components ([Jest](https://github.com/facebook/jest)).
2. Shallow-render testing components ([enzyme](https://github.com/airbnb/enzyme)).
3. Testing within your native environment, using native JS hooks ([Appium](http://appium.io/)).
4. Testing completely within your native environment ([XCTest](https://developer.apple.com/reference/xctest)).

Cavy(forked) fits in between shallow-render testing and testing within your native
environment.

## Installation

To get started using Cavy(forked), install it using `yarn`:

    yarn add git+https://git@github.com/dkaufhold/cavy-forked --dev
    yarn add git+https://git@github.com/dkaufhold/cavy-forked-cli --dev

or `npm`:

    npm i --save-dev git+https://git@github.com/dkaufhold/cavy-forked
    npm i --save-dev git+https://git@github.com/dkaufhold/cavy-forked-cli

It has not yet been released on npm

Add this script to your `package.json`

```json5
{
    // ...
    "scripts": {
        "cavy": "node ./node_modules/cavy-cli/src/server.js",
    }
    // ...
}
```

## Usage

WIP (currently no sample provided but soon to be added): Check out [the sample app](https://github.com/dkaufhold/cavy-forked/tree/master/sample-app/CavyDirectory)
for example usage. Here it is running:

### 1. Set up the Tester

Import `Tester` and `TestHookStore` in your top-level JS file
(typically this is your `App.js` file).
Instantiate a new `TestHookStore` and render your app inside a `Tester`.

```javascript
// App.js
import React from 'react';
import { Tester, TestHookStore } from 'cavy';
import Specs from './specs/index.js';

const testHookStore = new TestHookStore();

export default class App extends React.Component {
  render() {
    return (
      <Tester store={testHookStore} waitTime={4000} specs={Specs}>
        <MainAppCode />
      </Tester>
    );
  }
}
```

**Tester props**

| Prop | Type | Description | Default |
| :------------ |:---------------:| :--------------- | :---------------: |
| specs (required) | Map | Your registered spec functions | - |
| store (required) | TestHookStore | The newly instantiated TestHookStore component | - |
| waitTime | Integer | Time in milliseconds that your tests should wait to find a component | 2000 |
| startDelay | Integer | Time in milliseconds before test execution begins | 0 |
| clearAsyncStorage | Boolean | If true, clears AsyncStorage between each test e.g. to remove a logged in user | false |
| beforeAll | Function | A function to be executed before all tests are running. Useful to set up login sessions or reset the app state | - |
| afterAll | Function | A function to be executed after all tests have run. Useful for cleaning up after the test runner. | - |

### 2. Hook up components

Add a test hook to any components you want to test by adding a ref and using the
`generateTestHook` function. Then export a hooked version of the parent component.

`generateTestHook` takes a string as its first argument - this is the
identifier used in tests. It takes an optional second argument in case
you also want to set your own ref generating function.

```javascript
// src/Scene.js

import React, { Component } from 'react';
import { TextInput } from 'react-native';
import { hook } from 'cavy';

class Scene extends Component {
  render() {
    return (
      <View>
        <TextInput
          ref={this.props.generateTestHook('Scene.TextInput')}
          onChangeText={...}
        />
      </View>      
    );
  }
}

const TestableScene = hook(Scene);
export default TestableScene;
```

If you already have a ref assigned for that component, you can pass it through the `generateTestHook` function as a callback like so:

```javascript
<TextInput
  ref={this.props.generateTestHook('Scene.TextInput', (ref) => (this.input = ref))}
  onChangeText={...}
/>
```

### 3. Write test cases

Write your spec functions referencing your hooked-up components. [See below](#available-spec-helpers) for a list of currently available spec
helper functions.

```javascript
// specs/AppSpec.js

export default function(spec) {
  spec.describe('My feature', function() {
    spec.it('works', async function() {
      await spec.fillIn('Scene.TextInput', 'some string')
      await spec.press('Scene.button');
      await spec.exists('NextScene');
    });
  });
}
```

Then register your spec function in a central location. We will need to add this map to the `Tester` component

```javascript
// specs/index.js
import AppSpec from './AppSpec'

const registeredSpecs = new Map([
  ['AppSpec', AppSpec],
])

export default registeredSpecs

```

The test runner will respect the order in which the test specs are registered. So you can chain them and for example put login tests first and logout tests last in the list.

### 4. Running tests

You will need cavy-cli to actually run the tests.

When you're done with [the setup](https://github.com/dkaufhold/cavy-forked-cli#Installation), you can run `yarn cavy` or `npm run cavy` to start the test server.

You will need to start your app afterwards. Either in a simulator or a connected device.  
If you're already running an app, you can just refresh it.

Once the app has connected to the test server, you just press `T` to run the tests.

**Lean back and enjoy the show**

### Apps that use native code

If you're not using [Create React Native App][crna], you'll need to register
your `AppWrapper` as the main entry point with `AppRegistry` instead of your
current `App` component:

```javascript
AppRegistry.registerComponent('AppWrapper', () => AppWrapper);
```

## Available spec helpers

| Function | Description |
| :------------ | :--------------- |
| `fillIn(identifier, str)` | Fills in the identified component with the string<br>Component must respond to `onChangeText` |
| `press(identifier)` | Presses the identified component<br>Component must respond to `onPress` |
| `pause(integer)` | Pauses the test for this length of time (milliseconds)<br>Useful if you need to allow time for a response to be received before progressing |
| `exists(identifier)` | Returns `true` if the component can be identified (i.e. is currently on screen) |
| `notExists(identifier)` | As above, but checks for the absence of the component |
| `findComponent(identifier)` | Returns the identified component<br>Can be used if your component doesn't respond to either `onChangeText` or `onPress`<br>For example:<br>```const picker = await spec.findComponent('Scene.modalPicker');```<br>```picker.open();```|
| `isFullyVisible` | (WIP:) Will check if the bounding box of the component is inside the visible viewport. It is able to check if the component is hidden behind the keyboard, but it will not be able check, if the component is obstructed by another component.

## Writing your own spec helpers

Want to test something not included above? Write your own spec helper function!

Your function will need to be asynchronous and should throw an error in situations
where you want the test to fail. For example, the following tests whether a `<Text>` component displays the correct text.

```javascript
// specs/helpers.js

export async function containsText(component, text) {
  if (!component.props.children.includes(text)) {
    throw new Error(`Could not find text ${text}`);
  };
}
```
```javascript
// specs/AppSpec.js

import { containsText } from './helpers';

export default function(spec) {
  spec.describe('Changing the text', function() {
    spec.it('works', async function() {
      await spec.press('Scene.button');
      const text = await spec.findComponent('Scene.text');
      await containsText(text, 'you pressed the button');
    });
  });
}
```

## FAQs

#### How does Cavy(forked) compare to Appium? What is the benefit?

Cavy(forked) is a comparable tool to Appium. The key difference is that Appium uses
native hooks to access components (accessibility IDs), wheras Cavy(forked) uses React
Native refs. This means that Cavy(forked) sits directly within your React Native
environment (working identically with both Android and iOS builds), making it
easy to integrate into your application very quickly, without much
overhead.

#### What does this allow me to do that Jest does not?

Jest is a useful tool for unit testing individual React Native components,
whereas Cavy(forked) is an integration testing tool allowing you to run end-to-end user
interface tests.

#### How about supporting stateless components?

We'd love for Cavy(forked) to be better compatible with stateless functional components
and would be more than happy to see its reliance on refs replaced with something
better suited to the task...
What that looks like specifically, we're not 100% sure yet. We're very happy to
discuss possible alternatives!

## Contributing
Before contributing, please read the [code of conduct](CODE_OF_CONDUCT.md).
- Check out the latest master to make sure the feature hasn't been implemented
  or the bug hasn't been fixed yet.
- Check out the issue tracker to make sure someone already hasn't requested it
  and/or contributed it.
- Fork the project.
- Start a feature/bugfix branch.
- Commit and push until you are happy with your contribution.
- Please try not to mess with the package.json, version, or history. If you
  want to have your own version, or is otherwise necessary, that is fine, but
  please isolate to its own commit so we can cherry-pick around it.
  
## Roadmap

Because this fork already has been decoupled from many react native requirements, there are plans to turn it into a universal testing tool for react native and react web apps alike.

Stay tuned

[crna]: https://github.com/react-community/create-react-native-app
[cli]: https://github.com/dkaufhold/cavy-cli
