import { Animation } from '../animations/animation';
import { MenuComponent } from './menu.component';
import { Platform } from '../platform/platform';
import { MenuType } from './menu-type';
import { Menu } from './menu.interface';

/**
 * @hidden
 * Menu Reveal Type
 * The content slides over to reveal the menu underneath.
 * The menu itself, which is under the content, does not move.
 */
export class MenuRevealType extends MenuType {
  private menuWidth: string;
  private contentOpen: Animation;

  constructor(private menu: Menu, plt: Platform) {
    super(plt);

    this.menuWidth = this.getMenuWidth();
    this.contentOpen = new Animation(plt, menu.getContentElement());
    this.contentOpen.fromTo('translateX', '0px', this.menuWidth);
    this.ani.add(this.contentOpen);

    plt.win().addEventListener('orientationchange',
      () => setTimeout(() => this.onOrientationChange(), 100)
    );
  }

  onOrientationChange() {
    const newMenuWidth = this.getMenuWidth();
    if (this.menuWidth !== newMenuWidth) {
      this.contentOpen.fromTo('translateX', this.menuWidth, newMenuWidth);
      this.contentOpen.play();
      this.menuWidth = newMenuWidth;
      this.contentOpen.fromTo('translateX', '0px', this.menuWidth);
    }
  }

  private getMenuWidth(): string {
    return (this.menu.width() * (this.menu.isRightSide ? -1 : 1)) + 'px';
  }
}
