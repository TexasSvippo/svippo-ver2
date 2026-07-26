'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'
import './studio-overrides.scss'

export default function StudioClient() {
  return <NextStudio config={config} />
}
