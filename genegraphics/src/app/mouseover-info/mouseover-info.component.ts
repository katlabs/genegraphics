import { Component, Input } from '@angular/core';
import { Feature } from '@app/shared/models/models';

@Component({
  selector: 'app-mouseover-info',
  templateUrl: './mouseover-info.component.html',
  styleUrls: ['./mouseover-info.component.scss'],
})
export class MouseoverInfoComponent {
  @Input() mouseOverFeature!: Feature;
}
