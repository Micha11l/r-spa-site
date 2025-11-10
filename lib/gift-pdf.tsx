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

export async function renderGiftPdfBuffer(p: GiftPdfProps): Promise<ArrayBuffer> {
  const instance = pdf(<GiftCardPdf {...p} />);
  
  try {
    const blob = await instance.toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // 2. 直接返回 ArrayBuffer
    return arrayBuffer;

  } catch (err) {
    console.error("Error using toBlob, trying toBuffer:", err);
    
    // 3. (推荐) 修复备用逻辑
    try {
      const result = await instance.toBuffer();
      
      // 确保返回 ArrayBuffer
      if (result instanceof ArrayBuffer) {
        return result;
      }
      if (result instanceof Uint8Array) {
        // 转换 Uint8Array (包括 Node.js Buffer) 为 ArrayBuffer
        return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
      }
      
      throw new Error("toBuffer did not return a valid buffer type");

    } catch (bufferErr) {
      console.error("Error using toBuffer:", bufferErr);
      throw new Error("Failed to generate PDF buffer");
    }
  }
}
