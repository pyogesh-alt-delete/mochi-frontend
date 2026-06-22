import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    template: '<router-outlet />',
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [':host { display: block; min-height: 100vh; }']
})
export class AppComponent implements OnInit {
  constructor(private theme: ThemeService) {}
  ngOnInit() { /* ThemeService constructor handles initialization */ }
}
