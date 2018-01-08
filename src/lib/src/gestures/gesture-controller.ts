/* tslint:disable */
import { forwardRef, Inject, Injectable } from '@angular/core';
import { assert } from '../util/util';

/** @private */
export const GESTURE_MENU_SWIPE = 'menu-swipe';

/**
* @private
*/
export const enum GesturePriority {
  Minimun = -10000,
  VeryLow = -20,
  Low = -10,
  Normal = 0,
  High = 10,
  VeryHigh = 20,
  VeryVeryHigh = 30,

  MenuSwipe = High,
}

/**
* @private
*/
export interface GestureOptions {
  name: string;
  disableScroll?: boolean;
  priority?: number;
}

/**
* @private
*/
export interface BlockerOptions {
  disableScroll?: boolean;
  disable?: string[];
}

/**
* @private
*/
export const BLOCK_ALL: BlockerOptions = {
  disable: [GESTURE_MENU_SWIPE],
  disableScroll: true
};

/**
* @private
*/
@Injectable()
export class GestureController {

  private id = 1;
  private requestedStart: { [eventId: number]: number } = {};
  private disabledGestures: { [eventName: string]: Set<number> } = {};
  private disabledScroll: Set<number> = new Set<number>();
  private capturedID: number = null;

  constructor() { }

  createGesture(opts: GestureOptions): GestureDelegate {
    if (!opts.name) {
      throw new Error('name is undefined');
    }
    return new GestureDelegate(opts.name, this.newID(), this,
      opts.priority || 0,
      !!opts.disableScroll
    );
  }

  createBlocker(opts: BlockerOptions = {}): BlockerDelegate {
    return new BlockerDelegate(this.newID(), this,
      opts.disable,
      !!opts.disableScroll
    );
  }

  newID(): number {
    const id = this.id; this.id++;
    return id;
  }

  start(gestureName: string, id: number, priority: number): boolean {
    if (!this.canStart(gestureName)) {
      delete this.requestedStart[id];
      return false;
    }

    this.requestedStart[id] = priority;
    return true;
  }

  capture(gestureName: string, id: number, priority: number): boolean {
    if (!this.start(gestureName, id, priority)) {
      return false;
    }
    const requestedStart = this.requestedStart;
    let maxPriority = GesturePriority.Minimun;
    for (const gestureID in requestedStart) {
      maxPriority = Math.max(maxPriority, requestedStart[gestureID]);
    }

    if (maxPriority === priority) {
      this.capturedID = id;
      this.requestedStart = {};
      return true;
    }
    delete requestedStart[id];
    return false;
  }

  release(id: number) {
    delete this.requestedStart[id];
    if (this.capturedID && id === this.capturedID) {
      this.capturedID = null;
    }
  }

  disableGesture(gestureName: string, id: number) {
    let set = this.disabledGestures[gestureName];
    if (!set) {
      set = new Set<number>();
      this.disabledGestures[gestureName] = set;
    }
    set.add(id);
  }

  enableGesture(gestureName: string, id: number) {
    const set = this.disabledGestures[gestureName];
    if (set) {
      set.delete(id);
    }
  }

  disableScroll(id: number) {
    const isEnabled = !this.isScrollDisabled();
    this.disabledScroll.add(id);
  }

  enableScroll(id: number) {
    const isDisabled = this.isScrollDisabled();
    this.disabledScroll.delete(id);
  }

  canStart(gestureName: string): boolean {
    if (this.capturedID) {
      // a gesture already captured
      return false;
    }

    if (this.isDisabled(gestureName)) {
      return false;
    }
    return true;
  }

  isCaptured(): boolean {
    return !!this.capturedID;
  }

  isScrollDisabled(): boolean {
    return this.disabledScroll.size > 0;
  }

  isDisabled(gestureName: string): boolean {
    const disabled = this.disabledGestures[gestureName];
    if (disabled && disabled.size > 0) {
      return true;
    }
    return false;
  }

}

/**
* @private
*/
export class GestureDelegate {

  constructor(
    private name: string,
    private id: number,
    private controller: GestureController,
    private priority: number,
    private disableScroll: boolean
  ) { }

  canStart(): boolean {
    if (!this.controller) {
      assert(false, 'delegate was destroyed');
      return false;
    }
    return this.controller.canStart(this.name);
  }

  start(): boolean {
    if (!this.controller) {
      assert(false, 'delegate was destroyed');
      return false;
    }
    return this.controller.start(this.name, this.id, this.priority);
  }

  capture(): boolean {
    if (!this.controller) {
      assert(false, 'delegate was destroyed');
      return false;
    }
    const captured = this.controller.capture(this.name, this.id, this.priority);
    if (captured && this.disableScroll) {
      this.controller.disableScroll(this.id);
    }
    return captured;
  }

  release() {
    if (!this.controller) {
      assert(false, 'delegate was destroyed');
      return;
    }
    this.controller.release(this.id);
    if (this.disableScroll) {
      this.controller.enableScroll(this.id);
    }
  }

  destroy() {
    this.release();
    this.controller = null;
  }
}

/**
* @private
*/
export class BlockerDelegate {

  blocked = false;

  constructor(
    private id: number,
    private controller: GestureController,
    private disable: string[],
    private disableScroll: boolean
  ) { }

  block() {
    if (!this.controller) {
      assert(false, 'delegate was destroyed');
      return;
    }
    if (this.disable) {
      this.disable.forEach(gesture => {
        this.controller.disableGesture(gesture, this.id);
      });
    }

    if (this.disableScroll) {
      this.controller.disableScroll(this.id);
    }
    this.blocked = true;
  }

  unblock() {
    if (!this.controller) {
      assert(false, 'delegate was destroyed');
      return;
    }
    if (this.disable) {
      this.disable.forEach(gesture => {
        this.controller.enableGesture(gesture, this.id);
      });
    }
    if (this.disableScroll) {
      this.controller.enableScroll(this.id);
    }
    this.blocked = false;
  }

  destroy() {
    this.unblock();
    this.controller = null;
  }
}
