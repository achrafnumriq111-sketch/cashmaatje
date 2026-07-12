/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  siteName: string
  recipientName?: string
  monthLabel: string
  uploadUrl: string
  bankName?: string
}

const BankCsvReminderEmail = ({ siteName, recipientName, monthLabel, uploadUrl, bankName }: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Upload je bankafschrift over {monthLabel} in {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Tijd om je bankafschrift te uploaden</Heading>
        <Text style={text}>{recipientName ? `Hoi ${recipientName},` : 'Hoi,'}</Text>
        <Text style={text}>
          Om je administratie in {siteName} actueel te houden, upload je maandelijks een CSV-export van je{' '}
          {bankName ? bankName : 'zakelijke bankrekening'}. Zo blijven je transacties, BTW en dashboard kloppen.
        </Text>

        <Section style={card}>
          <Text style={small}><strong>Periode:</strong> {monthLabel}</Text>
          <Text style={small}><strong>Wat te uploaden:</strong> CSV of MT940 met de mutaties van de afgelopen maand.</Text>
        </Section>

        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button style={button} href={uploadUrl}>Upload je bank-CSV</Button>
        </Section>

        <Section style={card}>
          <Text style={small}><strong>Hoe download je een CSV?</strong></Text>
          <Text style={small}>• <strong>ING</strong>: Mijn ING → Downloaden → CSV</Text>
          <Text style={small}>• <strong>Rabobank</strong>: Rabo Internetbankieren → Downloaden mutaties → CSV/CAMT</Text>
          <Text style={small}>• <strong>ABN AMRO</strong>: Zelfservice → Afschriften → TXT/CSV</Text>
          <Text style={small}>• <strong>Knab / bunq / Revolut</strong>: In de app → Export → CSV</Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          Deze herinnering krijg je omdat maandelijkse CSV-reminders aanstaan voor je organisatie.
          Uitzetten kan in {siteName} → Instellingen → Bankrekeningen.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BankCsvReminderEmail,
  subject: (d: Record<string, any>) => `Upload je bankafschrift — ${d.monthLabel}`,
  displayName: 'Maandelijkse bank-CSV reminder',
  previewData: {
    siteName: 'CashMaatje',
    recipientName: 'Tom',
    monthLabel: 'november 2026',
    uploadUrl: 'https://cashmaatje.com/bank/import',
    bankName: 'ING',
  },
} satisfies TemplateEntry

export default BankCsvReminderEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif', color: '#0f1011' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 600, margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#2e2e2e', margin: '0 0 14px' }
const small = { fontSize: '13px', lineHeight: '20px', color: '#2e2e2e', margin: '0 0 6px' }
const card = { backgroundColor: '#f5f5f7', borderRadius: '12px', padding: '16px 20px', margin: '16px 0' }
const button = { backgroundColor: '#0f1011', color: '#ffffff', padding: '12px 24px', borderRadius: '999px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'inline-block' }
const hr = { borderColor: '#eaeaea', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#9f9fa0', lineHeight: '18px' }
