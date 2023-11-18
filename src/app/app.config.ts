import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { PartyTownConfig, providePartyTown } from "./services/party-town.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    providePartyTown({
      partyTown: {
        enabled: true,
        debug: false,
      },
      gtm: {
        enabled: true,
        key: 'GTM-NLMGSWS', // set your configured GTM key here
      },
    } as PartyTownConfig)
  ]
};
