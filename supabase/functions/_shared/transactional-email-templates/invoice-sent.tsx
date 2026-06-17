/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  siteName: string
  recipientName?: string
  senderName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  totalFormatted: string
  message?: string
  pdfUrl?: string
  paymentUrl?: string
  iban?: string
  paymentReference?: string
}

const InvoiceSentEmail = ({
  siteName, recipientName, senderName, invoiceNumber, invoiceDate, dueDate,
  totalFormatted, message, pdfUrl, paymentUrl, iban, paymentReference,
}: Props) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>Factuur {invoiceNumber} van {senderName} — {totalFormatted}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Factuur {invoiceNumber}</Heading>
        <Text style={text}>
          {recipientName ? `Beste ${recipientName},` : 'Beste klant,'}
        </Text>
        <Text style={text}>
          {message || `Hierbij ontvangt u factuur ${invoiceNumber} van ${senderName}.`}
        </Text>

        <Section style={card}>
          <Row label="Factuurnummer" value={invoiceNumber} />
          <Row label="Factuurdatum" value={invoiceDate} />
          <Row label="Vervaldatum" value={dueDate} />
          <Row label="Totaalbedrag" value={totalFormatted} bold />
        </Section>

        {paymentUrl && (
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={button} href={paymentUrl}>Direct online betalen</Button>
          </Section>
        )}

        {iban && (
          <Section style={card}>
            <Text style={small}>
              <strong>Overschrijving</strong><br />
              IBAN: <code>{iban}</code><br />
              Kenmerk: <code>{paymentReference || invoiceNumber}</code><br />
              Bedrag: {totalFormatted}
            </Text>
          </Section>
        )}

        {pdfUrl && (
          <Text style={text}>
            <Link href={pdfUrl} style={link}>Bekijk de factuur als PDF</Link>
          </Text>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Vragen over deze factuur? Reageer dan op deze e-mail.<br />
          Verzonden via {siteName}.
        </Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <Section style={{ borderBottom: '1px solid #eaeaea', padding: '8px 0' }}>
    <table style={{ width: '100%' }}><tbody><tr>
      <td style={{ color: '#666', fontSize: '13px' }}>{label}</td>
      <td style={{ textAlign: 'right', fontSize: '14px', fontWeight: bold ? 600 : 400 }}>{value}</td>
    </tr></tbody></table>
  </Section>
)

export const template = {
  component: InvoiceSentEmail,
  subject: (d: Record<string, any>) => `Factuur ${d.invoiceNumber} van ${d.senderName}`,
  displayName: 'Factuur naar klant',
  previewData: {
    siteName: 'Cash Maatje',
    senderName: 'Jouw Bedrijf B.V.',
    recipientName: 'Acme Nederland',
    invoiceNumber: 'F2025-0042',
    invoiceDate: '17 juni 2026',
    dueDate: '17 juli 2026',
    totalFormatted: '€ 1.234,56',
    iban: 'NL00BANK0123456789',
    paymentReference: 'F2025-0042',
  },
} satisfies TemplateEntry

export default InvoiceSentEmail

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Arial, sans-serif', color: '#0f1011' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 600, margin: '0 0 16px', letterSpacing: '-0.02em' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#2e2e2e', margin: '0 0 14px' }
const small = { fontSize: '13px', lineHeight: '20px', color: '#2e2e2e', margin: 0 }
const card = { backgroundColor: '#f5f5f7', borderRadius: '12px', padding: '16px 20px', margin: '20px 0' }
const button = { backgroundColor: '#0f1011', color: '#ffffff', padding: '12px 24px', borderRadius: '999px', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'inline-block' }
const link = { color: '#0f1011', textDecoration: 'underline' }
const hr = { borderColor: '#eaeaea', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#9f9fa0', lineHeight: '18px' }
