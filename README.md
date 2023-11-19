# Angular 17 SSR and i18n with Partytown Example

This project serves as an example to showcase the integration of Angular 17 with Server-Side Rendering (SSR), internationalization (i18n), and the Partytown library for executing third-party scripts in web workers.

## Features

- **Angular 17**: Utilizes the latest features and best practices of Angular 17.
- **Server-Side Rendering (SSR)**: Enhances performance and SEO by pre-rendering pages on the server.
- **Internationalization (i18n)**: Supports multiple languages for a global audience.
- **Partytown Integration**: Optimizes third-party script execution to improve website loading times.
- **Google Tag Assistant Debuging**: It also works with the tagassistant.google.com debug assistant.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Angular CLI](https://angular.io/cli)

### Installation

1. Clone the repository:

```bash
git clone git@github.com:find-ida/angular-ssr-partytown.git
cd angular-ssr-partytown
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run start
```

### Building for Production

To build the application for production, run:

```bash
npm run build
```

### Run production

To build and run the application for production, run ([http://localhost:4000/en/](http://localhost:4000/en/)):

```bash
npm run serve:run
```

## Usage

This project is structured to demonstrate key functionalities:

- **SSR**: The server-side rendering is set up in the `server.ts` file.
- **i18n**: Internationalization is configured in various component templates and module configurations.
- **Partytown**: The Partytown library is integrated through the `providePartyTown` function in the application module.

### providePartyTown

- `src/app/app.config.ts`

```ts
// Ready to start settings:
providePartyTown({
    partyTown: {
        enabled: true,
        debug: false,
    },
    gtm: {
        enabled: true,
        key: 'GTM-NLMGSWS', // set your configured GTM key here
    },
} as PartyTownConfig);

// Full configuration (with default values)
providePartyTown({
    partyTown: {
        enabled: true,
        debug: false,
        basePath: '/~partytown',
        forward: ['dataLayer.push', 'fbq'],
        proxyUri: '/gtm',
        proxiedHosts: ["region1.analytics.google.com", "googletagmanager.com", "connect.facebook.net", "googleads.g.doubleclick.net"]
    },
    gtm: {
        enabled: false,
        key: ''
    }
});
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
