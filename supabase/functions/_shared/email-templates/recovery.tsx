/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Stel je wachtwoord opnieuw in voor {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Wachtwoord opnieuw instellen</Heading>
        <Text style={text}>
          We ontvingen een verzoek om je wachtwoord voor {siteName} opnieuw in te stellen.
          Klik op de knop hieronder om een nieuw wachtwoord te kiezen.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Wachtwoord resetten
        </Button>
        <Text style={footer}>
          Heb je dit niet aangevraagd? Dan kun je deze e-mail veilig negeren —
          je wachtwoord blijft ongewijzigd.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#0a0a0a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#3f3f46',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const button = {
  backgroundColor: '#10a867',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '14px 24px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#71717a', margin: '32px 0 0', lineHeight: '1.5' }
