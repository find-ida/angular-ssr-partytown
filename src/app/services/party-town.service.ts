import {
  APP_INITIALIZER,
  EnvironmentProviders,
  inject,
  Injectable,
  InjectionToken,
  LOCALE_ID,
  makeEnvironmentProviders,
  PLATFORM_ID,
} from '@angular/core';
import type { PartytownConfig } from '@builder.io/partytown/integration';
import { EMPTY } from "rxjs";
import { DOCUMENT, isPlatformBrowser } from "@angular/common";


declare global {
  interface Window {
    dataLayer: DataLayer;
    partyTown: PartytownConfig;
  }
}

type DataLayerObject = Record<string, string | number | null | object>;
type DataLayer = DataLayerObject[];

export type PartyTownConfig = {
  partyTown?: {
    enabled: boolean;
    debug?: boolean;
    basePath?: string;
    locale?: string;
    forward?: string[];
    proxyUri?: string;
    proxiedHosts?: string[];
  }
  gtm?: {
    enabled?: boolean;
    key?: string;
    initialDataLayerProps?: DataLayerObject;
  }
};

const PARTY_TOWN_CONFIG = new InjectionToken<PartyTownConfig>('partyTownConfig');

/**
 * Provides configuration for PartyTown and Google Tag Manager (GTM) integration.
 *
 * This function prepares and provides the necessary configuration for integrating PartyTown and GTM
 * into an application environment. It sets up default values for various configuration options if
 * they are not explicitly provided. The configuration includes settings for PartyTown's behavior
 * (e.g., debug mode, proxy URI) and GTM settings (e.g., enabled state, API key).
 *
 * @param {PartyTownConfig} config - The configuration object for PartyTown and GTM.
 *    partyTown: {
 *      enabled - Determines if PartyTown should be enabled. Required.
 *      debug - Enables debug mode for PartyTown.
 *      basePath - Base path for PartyTown.
 *      locale - BasePath url prefix for i18n
 *      forward - Array of strings to forward to PartyTown.
 *      proxyUri - URI for the proxy used by PartyTown.
 *      proxiedHosts - Array of hosts that should be proxied.
 *    }
 *    gtm: {
 *      enabled - Determines if GTM should be enabled.
 *      key - The GTM container key.
 *      initialDataLayerProps - Initial properties for the data layer. Optional.
 *    }
 *
 * @returns {EnvironmentProviders} An array of providers for configuring the application environment,
 *    including the PARTY_TOWN_CONFIG token and APP_INITIALIZER with the necessary setup for PartyTown
 *    and GTM based on the provided configuration.
 *
 * @example
 * // Example usage with default values
 * providePartyTown({
 *   partyTown: {
 *     enabled: true, // Required
 *     debug: false, // Default
 *     basePath: '/~partytown', // Default
 *     locale: LOCALE_ID, // Default
 *     forward: ['dataLayer.push', 'fbq'], // Default
 *     proxyUri: '/gtm', // Default
 *     proxiedHosts: [
 *       "region1.analytics.google.com", // Default
 *       "googletagmanager.com", // Default
 *       "connect.facebook.net", // Default
 *       "googleads.g.doubleclick.net" // Default
 *     ]
 *   },
 *   gtm: {
 *     enabled: false, // Default
 *     key: '' // Default
 *   }
 * });
 */
export const providePartyTown = (config: PartyTownConfig): EnvironmentProviders => makeEnvironmentProviders([
  {
    provide: PARTY_TOWN_CONFIG,
    useValue: ({
      ...config,
      partyTown: {
        ...config.partyTown,
        debug: config.partyTown?.debug ?? false,
        basePath: config.partyTown?.basePath ?? '/~partytown',
        locale: config.partyTown?.locale ?? inject(LOCALE_ID),
        forward: config.partyTown?.forward ?? ['dataLayer.push', "fbq"],
        proxyUri: config.partyTown?.proxyUri ?? "/gtm",
        proxiedHosts: config.partyTown?.proxiedHosts ?? [
          "region1.analytics.google.com",
          "googletagmanager.com",
          "connect.facebook.net",
          "googleads.g.doubleclick.net",
        ],
      },
      gtm: {
        ...config.gtm,
        enabled: config.gtm?.enabled ?? false,
        key: config.gtm?.key ?? '',
      }
    } as PartyTownConfig)
  },
  {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory: (platformId: Object, gtmService: PartyTownService) => {
      if (config.partyTown?.enabled && isPlatformBrowser(platformId)) gtmService.injectScript();
      return () => EMPTY;
    },
    deps: [PLATFORM_ID, PartyTownService]
  },
]);


/**
 * Shout out to renatoaraujoc which inspired this service
 * https://gist.github.com/renatoaraujoc/5491f54c3abe29913f9877c7e0d2ee0d
 */
@Injectable({
  providedIn: 'root'
})
export class PartyTownService {
  private readonly config = inject(PARTY_TOWN_CONFIG, {optional: true});
  private readonly document = inject(DOCUMENT);
  private readonly window = inject(DOCUMENT).defaultView!;

  private isGtmScriptAppended = false;
  private lastDataLayerProps: DataLayerObject = {};

  private get dataLayer(): DataLayer {
    this.checkIfGtmScriptIsAppended();
    return this.window.dataLayer;
  }

  injectScript() {
    if (!this.config?.partyTown) throw new Error(`PartyTown was not provided, please add 'providePartyTown() to your root providers first.'.`);
    this.initPartyTownScript();
    this.initGtmScript();
  }

  gtag = (data: any) => {
    this.checkIfGtmScriptIsAppended();
    this.dataLayer.push(data);
  };

  private initPartyTownScript() {
    if (!this.config?.partyTown) return;
    const config = this.config.partyTown;

    // Config Script
    const partyTownConfigurationScript = document.createElement('script');
    partyTownConfigurationScript.textContent = `partytown = {
      lib: "/${config.locale}${config.basePath}/",
      debug: ${config.debug ?? false},
      forward: ${JSON.stringify(config.forward ?? [])},
      resolveUrl: function (url, location, type) {
        const proxiedHosts = ${JSON.stringify(config.proxiedHosts ?? [])};
        if (proxiedHosts.includes(url.hostname)) {
          var proxyUrl = new URL('${this.window?.location.origin}${config.proxyUri ?? ''}');
          proxyUrl.searchParams.append('url', url.href);
          return proxyUrl;
        }
        return url;
      }
    };`;
    this.document.head.appendChild(partyTownConfigurationScript);

    // Lib Script
    const partyTownLibScript = document.createElement('script');
    partyTownLibScript.src = `/${config.locale}${config.basePath}/partytown.js`;
    // Attach partyTown script
    this.document.head.appendChild(partyTownLibScript);
  }

  private initGtmScript() {
    const config = this.config?.gtm;
    if (config?.enabled) {
      // Create initial dataLayer
      this.window.dataLayer = Array.isArray(this.window.dataLayer) ? this.window.dataLayer : [];
      // Set initial values for the dataLayer
      this.window.dataLayer.push(this.pushToDefaultDataLayer(config.initialDataLayerProps));
      // Check if request comes from tagassistant.google.com
      const isDebugMode = this.window ? !!new URL(`${this.window.location.href}`).searchParams.get('gtm_debug') : false;
      // Creat GTM Script
      const gtmScript = document.createElement('script');
      gtmScript.type = (isDebugMode || !this.config?.partyTown)
        ? 'text/javascript'
        : 'text/partyTown';
      gtmScript.crossOrigin = 'anonymous';
      gtmScript.textContent = `(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
  var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
  j.defer = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', '${config.key}');`;
      // Attach gtm script
      this.document.head.appendChild(gtmScript);
      this.isGtmScriptAppended = true;
    }
  }

  private pushToDefaultDataLayer(props: DataLayerObject = {}) {
    this.lastDataLayerProps = Object
      .keys(this.lastDataLayerProps)
      .reduce((acc, next) => {
          acc[next] = next in props ? props[next] ?? null : this.lastDataLayerProps[next];
          return acc;
        }, {} as DataLayerObject
      );
    return this.lastDataLayerProps;
  }

  private checkIfGtmScriptIsAppended() {
    if (!this.isGtmScriptAppended) throw new Error('injectScript() not called, initialize the GTM first.');
  }
}
