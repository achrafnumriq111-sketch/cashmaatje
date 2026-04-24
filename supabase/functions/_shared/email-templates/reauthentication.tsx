/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je verificatiecode voor Cash Maatje</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bevestig je identiteit</Heading>
        <Text style={text}>Gebruik onderstaande code om je identiteit te bevestigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Deze code verloopt binnen enkele minuten. Heb je dit niet aangevraagd? Negeer dan deze e-mail.
        </Text>
        <Text style={brand}>— Het Cash Maatje team</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: '#1d2128', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '28px', fontWeight: '700' as const, color: '#15bfa5', letterSpacing: '0.1em', margin: '0 0 30px', padding: '16px 24px', backgroundColor: '#f3f4f6', borderRadius: '12px', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#6b7280', margin: '32px 0 8px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }
const brand = { fontSize: '13px', color: '#6b7280', margin: '0' }
