'use client'

import { notFound } from 'next/navigation'
if (process.env.NODE_ENV === 'production') notFound()

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
