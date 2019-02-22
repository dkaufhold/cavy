import React, { Component, Children } from 'react'
import PropTypes from 'prop-types'
import {
  Keyboard,
  AsyncStorage,
  Dimensions,
  NativeModules,
  EmitterSubscription,
} from 'react-native'

import TestHookStore from './TestHookStore'
import TestScope from './TestScope'

import { View } from 'react-native'
import { Constants } from 'expo/build/Expo'

export default class Tester extends Component {

  static propTypes = {
    beforeAll: PropTypes.func,
    afterAll: PropTypes.func,
    waitTime: PropTypes.number,
    startDelay: PropTypes.number,
    specs: PropTypes.instanceOf(Map),
    clearAsyncStorage: PropTypes.bool,
  }
  getChildContext() {
    return {
      testHooks: this.testHookStore,
    }
  }

  static defaultProps = {
    beforeAll: () => null,
    afterAll: () => null,
    clearAsyncStorage: false,
    waitTime: 2000,
    startDelay: 0,
  }

  static childContextTypes = {
    testHooks: PropTypes.instanceOf(TestHookStore),
  }

  constructor(props, context) {
    super(props, context)
    const { width, height } = Dimensions.get('window')
    this.state = {
      key: Math.random(),
      keyboardHeight: 0,
      viewPortSize: {
        top: 0,
        left: 0,
        right: width,
        bottom: height,
      },
    }
    this.testHookStore = props.store
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this.setKeyboardState,
    )
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this.setKeyboardState,
    )
  }

  async componentDidMount() {
    if (__DEV__) {
      const initCavyConnection = (allowedRetries = 3) => {
        const scriptURLSplit = NativeModules.SourceCode.scriptURL.split(':')
        const URL = `${scriptURLSplit[0]}:${scriptURLSplit[1]}` + ':3030'
        let ws = new WebSocket(URL)
        console.log('Trying to establish connection to test server.')

        ws.onerror = (err) => {
          // @ts-ignore
          console.log(err.message)
        }

        ws.onopen = () => {
          console.log('Connected with test server!')
          ws.send(
            JSON.stringify({
              status: 'CONNECTED',
              deviceName: Constants.deviceName,
              installationId: Constants.installationId,
            }),
          )
        }

        ws.onmessage = (evt) => {
          const data = JSON.parse(evt.data)
          if (data.status === 'RUNTEST') {
            this.runTests(data.filter)
          }
        }

        ws.onclose = () => {
          console.log('Disconnected from test server!')
          setTimeout(() => {
            allowedRetries
              ? initCavyConnection(allowedRetries - 1)
              : console.log('Could not establish connection to test server.')
          }, 1000)
        }
      }
      initCavyConnection(3)
    }
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()
  }

  setKeyboardState = (e) => {
    const { width, height } = Dimensions.get('window')
    if (e) {
      const keyboardHeight = height - e.endCoordinates.screenY
      this.setState({
        keyboardHeight,
        viewPortSize: {
          top: 0,
          bottom: e.endCoordinates.screenY,
          left: 0,
          right: width,
        },
      })
    }
  }

  async runTests(filter) {
    await this.props.beforeAll()
    const specs = []
    let filterKeywords = []
    if (filter) filterKeywords = filter.split(',')
    function addSpec(key, value) {
      value.givenName = key
      specs.push(value)
    }
    this.props.specs.forEach(
      (value, key) => {
        if (filterKeywords.length)
          filterKeywords.forEach((filterKeyword) => {
            if (key.indexOf(filterKeyword) !== -1) addSpec(key, value)
          })
        else addSpec(key, value)
      },
    )
    const scope = new TestScope(
      this,
      this.props.waitTime,
      this.props.startDelay,
    )
    for (var i = 0; i < specs.length; i++) {
      await specs[i](scope)
    }
    await scope.run()
    await this.props.afterAll()
  }

  reRender() {
    this.setState({ key: Math.random() })
  }

  async clearAsync() {
    if (this.props.clearAsyncStorage) {
      try {
        await AsyncStorage.clear()
      } catch (e) {
        console.warn('[Cavy] failed to clear AsyncStorage:', e)
      }
    }
  }

  render() {
    return (
      <View key={this.state.key} style={{ flex: 1 }}>
        {Children.only(this.props.children)}
      </View>
    )
  }
}
