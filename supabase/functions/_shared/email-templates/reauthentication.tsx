/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Je verificatiecode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bevestig je identiteit</Heading>
        <Text style={text}>Gebruik onderstaande code om je identiteit te bevestigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Deze code verloopt binnenkort. Heb je dit niet aangevraagd? Negeer deze e-mail dan veilig.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0a0a0a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#3f3f46', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '28px', fontWeight: 'bold' as const, color: '#10a867',
  letterSpacing: '4px', margin: '0 0 30px',
}
const footer = { fontSize: '13px', color: '#71717a', margin: '32px 0 0', lineHeight: '1.5' }
