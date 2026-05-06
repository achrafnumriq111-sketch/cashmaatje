/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'CashMaatje'
const SITE_URL = 'https://cashmaatje.com'

interface TesterCredentialsProps {
  name?: string
  email?: string
  password?: string
  loginUrl?: string
}

const TesterCredentialsEmail = ({
  name,
  email,
  password,
  loginUrl,
}: TesterCredentialsProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je tester-account voor {SITE_NAME} staat klaar</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Welkom ${name},` : 'Welkom,'}
        </Heading>
        <Text style={text}>
          Er is een tester-account voor je aangemaakt op <strong>{SITE_NAME}</strong>.
          Je kunt direct inloggen met onderstaande gegevens.
        </Text>

        <Section style={credBox}>
          <Text style={credLabel}>E-mailadres</Text>
          <Text style={credValue}>{email}</Text>
          <Text style={credLabel}>Tijdelijk wachtwoord</Text>
          <Text style={credValue}>{password}</Text>
        </Section>

        <Button style={button} href={loginUrl || `${SITE_URL}/login`}>
          Inloggen
        </Button>

        <Text style={text}>
          Wijzig je wachtwoord na de eerste keer inloggen via je accountinstellingen.
        </Text>

        <Text style={footer}>
          Heb je deze e-mail onverwacht ontvangen? Negeer hem dan.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TesterCredentialsEmail,
  subject: `Je tester-account voor ${SITE_NAME}`,
  displayName: 'Tester credentials',
  previewData: {
    name: 'Jane',
    email: 'tester@voorbeeld.nl',
    password: 'TempPass1234',
    loginUrl: `${SITE_URL}/login`,
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 20px' }
const credBox = {
  backgroundColor: '#f4f4f5',
  borderRadius: '10px',
  padding: '18px 20px',
  margin: '0 0 24px',
}
const credLabel = { fontSize: '12px', color: '#71717a', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
const credValue = { fontSize: '15px', color: '#0a0a0a', margin: '0 0 14px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }
const button = {
  backgroundColor: '#10a867',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '0 0 24px',
}
const footer = { fontSize: '13px', color: '#71717a', margin: '32px 0 0', lineHeight: '1.5' }
