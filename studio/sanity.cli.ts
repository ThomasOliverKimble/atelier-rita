import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'ra5yjexn',
    dataset: 'production',
  },
  studioHost: 'backoffice--rita',
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    appId: 'fmsaa225eau27p1nwe6l6xxu',
  },
  schemaExtraction: {
    enabled: true,
    path: './schema.json',
  },
  typegen: {
    path: '../web/src/**/*.{ts,astro}',
    schema: './schema.json',
    generates: '../web/src/lib/sanity.types.ts',
  },
})
