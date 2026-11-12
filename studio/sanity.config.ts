import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {colorInput} from '@sanity/color-input'
import {media, mediaAssetSource} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'
import {linkResolverPreview} from './src/linkResolverPreview'
import {structure} from './src/deskStructure'

// The preview deployment renders drafts (see web/README.md, "Preview").
// Production is a static build and has no preview routes.
const previewOrigin =
  window.location.hostname === 'localhost'
    ? 'http://localhost:4321'
    : process.env.SANITY_STUDIO_PREVIEW_URL || 'https://preview.atelierrita.org'

export default defineConfig({
  name: 'default',
  title: 'Rita Backoffice',

  projectId: 'ra5yjexn',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    media(),
    visionTool(),
    colorInput(),
    presentationTool({
      title: 'Live preview',
      resolve: linkResolverPreview,
      previewUrl: {
        origin: previewOrigin,
        previewMode: {
          enable: '/api/preview',
          disable: '/api/exit-preview',
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },

  form: {
    // only allow picking images through the media plugin
    image: {
      assetSources: () => [mediaAssetSource],
    },
  },
})
