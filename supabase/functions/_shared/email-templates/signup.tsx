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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Bevestig je e-mailadres voor Cash Maatje</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welkom bij Cash Maatje</Heading>
        <Text style={text}>
          Bedankt voor je aanmelding! Bevestig je e-mailadres ({recipient}) door op de knop hieronder te klikken om je account te activeren.
        </Text>
        <Button style={button} href={confirmationUrl}>
          E-mailadres bevestigen
        </Button>
        <Text style={text}>Of kopieer en plak deze link in je browser:</Text>
        <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
        <Text style={footer}>
          Heb je geen account aangemaakt? Dan kun je deze e-mail negeren.
        </Text>
        <Text style={brand}>— Het Cash Maatje team</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: '600' as const, color: '#1d2128', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#15bfa5', textDecoration: 'underline', fontSize: '13px', wordBreak: 'break-all' as const }
const button = { backgroundColor: '#15bfa5', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block', margin: '0 0 24px' }
const footer = { fontSize: '13px', color: '#6b7280', margin: '32px 0 8px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }
const brand = { fontSize: '13px', color: '#6b7280', margin: '0' }
