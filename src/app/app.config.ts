import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes,
    withHashLocation(),

    withInMemoryScrolling({
      anchorScrolling: 'enabled',      // ← 讓 fragment 自動捲動
      scrollPositionRestoration: 'top'
    }),

    withRouterConfig({
      onSameUrlNavigation: 'reload'   // ← 加這行
    })

    ),

    provideHttpClient(),
    provideSweetAlert2({
        // Optional configuration
        fireOnInit: false,
        dismissOnDestroy: true,
    }),]
};
