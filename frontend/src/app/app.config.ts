import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { seedIfEmpty, seedCatalogIfEmpty } from './core/db/seed';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => seedIfEmpty().then(() => seedCatalogIfEmpty()),
      multi: true
    }
  ]
};
