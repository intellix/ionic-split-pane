/* tslint:disable */
import { Injectable, NgZone } from '@angular/core';

import { Config } from '../config/config';
import { DomController } from './dom-controller';
import { isTextInput } from '../util/dom';
import { Key } from './key';
import { Platform } from './platform';

const KEYBOARD_CLOSE_POLLING = 150;
const KEYBOARD_POLLING_CHECKS_MAX = 100;

/**
 * @name Keyboard
 * @description
 * The `Keyboard` class allows you to work with the keyboard events provided
 * by the Ionic keyboard plugin.
 *
 * @usage
 * ```ts
 * export class MyClass {
 *   constructor(public keyboard: Keyboard) {
 *
 *   }
 * }
 * ```
 */
@Injectable()
export class Keyboard {
  private _tmr: any;

  constructor(config: Config, private _plt: Platform, private _zone: NgZone, private _dom: DomController) {

    const win = _plt.win();

    _plt.registerListener(win, 'native.keyboardhide', () => {
      _plt.cancelTimeout(this._tmr);
      this._tmr = _plt.timeout(() => {
        // this custom cordova plugin event fires when the keyboard will hide
        // useful when the virtual keyboard is closed natively
        // https://github.com/driftyco/ionic-plugin-keyboard
        if (this.isOpen()) {
          this._plt.focusOutActiveElement();
        }
      }, 80);
    }, { zone: false, passive: true });

    _plt.registerListener(win, 'native.keyboardshow', () => {
      _plt.cancelTimeout(this._tmr);
    }, { zone: false, passive: true });

  }

  /**
   * Check to see if the keyboard is open or not.
   *
   * ```ts
   * export class MyClass {
   *   constructor(public keyboard: Keyboard) {
   *
   *   }
   *
   *   keyboardCheck() {
   *     console.log('The keyboard is open:', this.keyboard.isOpen());
   *   }
   * }
   * ```
   *
   * @return {boolean} returns a true or false value if the keyboard is open or not.
   */
  isOpen() {
    return this.hasFocusedTextInput();
  }

  /**
   * When the keyboard is closed, call any methods you want.
   *
   * ```ts
   * export class MyClass {
   *   constructor(public keyboard: Keyboard) {
   *     this.keyboard.onClose(this.closeCallback);
   *   }
   *   closeCallback() {
   *     // call what ever functionality you want on keyboard close
   *     console.log('Closing time');
   *   }
   * }
   * ```
   *
   * @param {function} callback method you want to call when the keyboard has been closed.
   * @return {function} returns a callback that gets fired when the keyboard is closed.
   */
  onClose(callback: Function, pollingInternval = KEYBOARD_CLOSE_POLLING, pollingChecksMax = KEYBOARD_POLLING_CHECKS_MAX) {
    const self = this;
    let checks = 0;

    let promise: Promise<any> = null;

    if (!callback) {
      // a callback wasn't provided, so let's return a promise instead
      promise = new Promise(resolve => { callback = resolve; });
    }

    function checkKeyboard() {
      if (!self.isOpen() || checks > pollingChecksMax) {
        self._plt.timeout(function() {
          self._zone.run(function() {
            callback();
          });
        }, 400);

      } else {
        self._plt.timeout(checkKeyboard, pollingInternval);
      }
      checks++;
    }

    self._plt.timeout(checkKeyboard, pollingInternval);

    return promise;
  }

  /**
   * Programmatically close the keyboard.
   */
  close() {
    this._dom.read(() => {
      if (this.isOpen()) {
        // only focus out when a text input has focus
        this._dom.write(() => {
          this._plt.focusOutActiveElement();
        });
      }
    });
  }

  hasFocusedTextInput() {
    const activeEle = this._plt.getActiveElement();
    if (isTextInput(activeEle)) {
      return (activeEle.parentElement.querySelector(':focus') === activeEle);
    }
    return false;
  }

}
