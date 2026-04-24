/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je inloglink voor Cash Maatje</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Je inloglink</Heading>
        <Text style={text}>
          Klik op de knop hieronder om in te loggen bij Cash Maatje. Deze link verloopt na korte tijd.
        </Text>
        <Button style={button} href={confirmationUrl}>Inloggen</Button>
        <Text style={text}>Of gebruik deze link:</Text>
        <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
        <Text style={footer}>Heb je deze link niet aangevraagd? Dan kun je deze e-mail negeren.</Text>
        <Text style={brand}>— Het Cash Maatje team</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: '#1d2128', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#15bfa5', textDecoration: 'underline', fontSize: '13px', wordBreak: 'break-all' as const }
const button = { backgroundColor: '#15bfa5', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block', margin: '0 0 24px' }
const footer = { fontSize: '13px', color: '#6b7280', margin: '32px 0 8px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }
const brand = { fontSize: '13px', color: '#6b7280', margin: '0' }
