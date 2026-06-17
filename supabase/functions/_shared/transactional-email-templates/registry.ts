/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as testerCredentials } from './tester-credentials.tsx'
import { template as invoiceSent } from './invoice-sent.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'tester-credentials': testerCredentials,
  'invoice-sent': invoiceSent,
}
