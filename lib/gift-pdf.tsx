// lib/gift-pdf.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 28 },
  title: { fontSize: 18, marginBottom: 16 },
  row: { marginBottom: 8 },
  code: { fontSize: 16, fontWeight: 700 },
});

export type GiftPdfProps = {
  value: number;            // 190 (CAD)
  code: string;             // RJ-0CHY-0Y0Q
  recipient?: string | null;
  sender?: string | null;
  message?: string | null;
};

export function GiftCardPdf(props: GiftPdfProps) {
  const { value, code, recipient, sender, message } = props;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Rejuvenessence Gift Card</Text>
        <View>
          <Text style={styles.row}>Value: ${value} CAD</Text>
          {!!recipient && <Text style={styles.row}>Recipient: {recipient}</Text>}
          {!!sender && <Text style={styles.row}>From: {sender}</Text>}
          {!!message && <Text style={styles.row}>Message: {message}</Text>}
          <Text style={[styles.row, styles.code]}>Code: {code}</Text>
          <Text>No expiry • Single or multiple redemptions</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderGiftPdfBuffer(p: GiftPdfProps): Promise<Buffer> {
  const instance = pdf(<GiftCardPdf {...p} />);

  try {
    // 在 Node.js 环境中使用 toBuffer()
    const result = await instance.toBuffer();

    // toBuffer() 返回的是 Node.js Buffer，直接返回
    return result as Buffer;

  } catch (err) {
    console.error("Error generating PDF:", err);
    throw new Error("Failed to generate PDF buffer");
  }
}
