import { Component, ViewChild, ElementRef, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { MenuComponent } from 'ionic-split-pane';
import { merge } from 'rxjs/Observable/merge';

@Component({
  selector: 'demo-app',
  template: `
    <ion-split-pane when="lg">
      <ion-menu #menu [content]="content">
        <div>Menu</div>
        <div>
          <b>Width:</b> {{ menu.width() }}
        </div>
        <div>
          <b>Content translateX:</b> {{ transform }}
        </div>
      </ion-menu>
      <section #content>
        <header>
          <button menuToggle>Toggle menu</button>
        </header>
        Main content
      </section>
    </ion-split-pane>
  `,
})
export class AppComponent implements OnInit {

  @ViewChild('menu') menu: MenuComponent;
  @ViewChild('content') content: ElementRef;

  transform: string;

  constructor(private changeRef: ChangeDetectorRef) {}

  ngOnInit() {
    merge(this.menu.ionOpen, this.menu.ionClose)
      .subscribe(() => this.setTransform());
  }

  @HostListener('document:orientationchange')
  setTransform() {
    this.transform = this.content.nativeElement.style.transform;
    this.changeRef.detectChanges();
  }
}
