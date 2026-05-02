/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je bent uitgenodigd voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Je bent uitgenodigd</Heading>
        <Text style={text}>
          Je bent uitgenodigd om mee te doen met{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Klik op de knop hieronder om de uitnodiging te accepteren en je account aan te maken.
        </Text>
        <Button style={button} href={confirmationUrl}>Uitnodiging accepteren</Button>
        <Text style={footer}>
          Verwachtte je deze uitnodiging niet? Dan kun je deze e-mail negeren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
