/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName, oldEmail, newEmail, confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Bevestig je e-mailwijziging voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bevestig je e-mailwijziging</Heading>
        <Text style={text}>
          Je hebt aangevraagd om je e-mailadres voor {siteName} te wijzigen van{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link>{' '}
          naar{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>Klik op de knop hieronder om deze wijziging te bevestigen:</Text>
        <Button style={button} href={confirmationUrl}>E-mailwijziging bevestigen</Button>
        <Text style={footer}>
          Heb je deze wijziging niet aangevraagd? Beveilig dan direct je account.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#10a867', textDecoration: 'underline' }
const button = {
  backgroundColor: '#10a867', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const,
  borderRadius: '10px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#71717a', margin: '32px 0 0', lineHeight: '1.5' }
