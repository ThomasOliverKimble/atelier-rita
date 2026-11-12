import home from './singletons/home'
import project from './documents/project'
import settings from './singletons/settings'
import projects from './singletons/projects'
import atelier from './singletons/atelier'

import localeString from './locale/localeString'
import localeText from './locale/localeText'
import localeBlockContent from './locale/localeBlockContent'

import blockContent from './objects/blockContent'
import linkExternal from './objects/linkExternal'
import linkInternal from './objects/linkInternal'
import linkIcon from './objects/linkIcon'
import keyVal from './objects/keyVal'
import {seoSchema} from './features/seo'
import news from './objects/news'
import cardHome from './objects/cardHome'

export const schemaTypes = [
  settings,
  home,
  project,
  atelier,
  projects,

  localeString,
  localeText,
  localeBlockContent,
  cardHome,

  blockContent,
  linkExternal,
  linkInternal,
  linkIcon,
  seoSchema,
  keyVal,
  news,
]
export default schemaTypes
