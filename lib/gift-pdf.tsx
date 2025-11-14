// lib/gift-pdf.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image, pdf } from "@react-pdf/renderer";

// 品牌色彩（根据你的网站调整）
const COLORS = {
  primary: "#1a5f7a",      // 深蓝绿色 - 专业、宁静
  secondary: "#86c5d8",    // 浅蓝色 - 柔和
  accent: "#e6956f",       // 珊瑚色 - 温暖、活力
  gold: "#d4af37",         // 金色 - 高级感
  text: "#2c3e50",         // 深灰色 - 文字
  textLight: "#7f8c8d",    // 浅灰色 - 次要文字
  background: "#f8f9fa",   // 浅灰背景
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    padding: 0,
  },
  
  // Header section with gradient effect (simulated)
  header: {
    backgroundColor: COLORS.primary,
    padding: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },
  
  logoContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  
  brandName: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    letterSpacing: 2,
  },
  
  tagline: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: "center",
    marginTop: 5,
    letterSpacing: 1,
  },
  
  // Gift card title
  giftCardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginTop: 20,
    letterSpacing: 1,
  },
  
  // Main content area
  contentContainer: {
    backgroundColor: COLORS.white,
    margin: 30,
    marginTop: -20, // Overlap header slightly
    padding: 40,
    borderRadius: 8,
    // Shadow effect (simulated with border)
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  
  // Value display
  valueContainer: {
    backgroundColor: COLORS.accent,
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
    alignItems: "center",
  },
  
  valueLabel: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 5,
    letterSpacing: 1,
  },
  
  valueAmount: {
    fontSize: 48,
    fontWeight: "bold",
    color: COLORS.white,
  },
  
  // Code section
  codeContainer: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 8,
    marginBottom: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
  },
  
  codeLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    letterSpacing: 1,
  },
  
  code: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: 3,
  },
  
  // Personal message section
  messageSection: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  
  messageLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  
  messageTo: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 5,
  },
  
  messageFrom: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 10,
  },
  
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 1.6,
    fontStyle: "italic",
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
  
  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  
  infoValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "bold",
  },
  
  // Redemption instructions
  instructionsSection: {
    marginTop: 25,
    padding: 20,
    backgroundColor: "#fff9e6",
    borderRadius: 8,
  },
  
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  
  instructionItem: {
    fontSize: 11,
    color: COLORS.text,
    marginBottom: 6,
    paddingLeft: 15,
    lineHeight: 1.5,
  },
  
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  
  footerText: {
    fontSize: 10,
    color: COLORS.textLight,
  },
  
  footerLink: {
    fontSize: 10,
    color: COLORS.primary,
  },
  
  // QR Code placeholder
  qrCodeContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  
  qrCodeText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
  },
});

export type GiftPdfProps = {
  value: number;             // 200 (CAD)
  code: string;              // RJ-0CHY-0Y0Q
  recipient?: string | null;
  sender?: string | null;
  message?: string | null;
  expiresAt?: string | null; // ISO date string
  purchasedAt?: string;      // ISO date string
};

export function GiftCardPdfEnhanced(props: GiftPdfProps) {
  const { value, code, recipient, sender, message, expiresAt, purchasedAt } = props;
  
  // Format dates
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  };
  
  const expiryDate = formatDate(expiresAt);
  const purchaseDate = formatDate(purchasedAt);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.brandName}>REJUVENESSENCE</Text>
            <Text style={styles.tagline}>Medical Spa & Wellness</Text>
          </View>
          <Text style={styles.giftCardTitle}>Gift Card</Text>
        </View>
        
        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Value */}
          <View style={styles.valueContainer}>
            <Text style={styles.valueLabel}>VALUE</Text>
            <Text style={styles.valueAmount}>${value}.00</Text>
            <Text style={styles.valueLabel}>CAD</Text>
          </View>
          
          {/* Gift Card Code */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>GIFT CARD CODE</Text>
            <Text style={styles.code}>{code}</Text>
          </View>
          
          {/* Personal Message */}
          {(recipient || sender || message) && (
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>Personal Message</Text>
              {recipient && (
                <Text style={styles.messageTo}>To: {recipient}</Text>
              )}
              {sender && (
                <Text style={styles.messageFrom}>From: {sender}</Text>
              )}
              {message && (
                <Text style={styles.messageText}>"{message}"</Text>
              )}
            </View>
          )}
          
          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Gift Card Details */}
          <View>
            {purchaseDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Purchased:</Text>
                <Text style={styles.infoValue}>{purchaseDate}</Text>
              </View>
            )}
            {expiryDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires:</Text>
                <Text style={styles.infoValue}>{expiryDate}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Redemptions:</Text>
              <Text style={styles.infoValue}>Single or Multiple</Text>
            </View>
          </View>
          
          {/* QR Code Placeholder */}
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCodePlaceholder}>
              <Text style={{ fontSize: 40, color: COLORS.primary }}>QR</Text>
            </View>
            <Text style={styles.qrCodeText}>
              Scan to redeem or visit:{"\n"}
              rejuvenessence.org/redeem
            </Text>
          </View>
          
          {/* Redemption Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to Redeem</Text>
            <Text style={styles.instructionItem}>
              • Visit rejuvenessence.org/redeem and enter your code
            </Text>
            <Text style={styles.instructionItem}>
              • Choose to save to your wallet or use immediately
            </Text>
            <Text style={styles.instructionItem}>
              • Book your service and apply your gift card at checkout
            </Text>
            <Text style={styles.instructionItem}>
              • Unused balance remains on your gift card
            </Text>
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rejuvenessence Medical Spa & Wellness
          </Text>
          <Text style={styles.footerLink}>
            rejuvenessence.org
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Export function to generate PDF buffer
export async function renderGiftPdfBuffer(p: GiftPdfProps): Promise<Uint8Array> {
  const instance = pdf(<GiftCardPdfEnhanced {...p} />);
  
  try {
    // Method 1: Use toBlob (works in both browser and Node.js)
    const blob = await instance.toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    
    // Convert to Uint8Array (avoids SharedArrayBuffer issues)
    return new Uint8Array(arrayBuffer);

  } catch (err) {
    console.error("Error using toBlob, trying toBuffer:", err);
    
    // Method 2: Fallback to toBuffer (Node.js)
    try {
      const result = await instance.toBuffer();
      
      // Ensure we return Uint8Array
      if (result instanceof Uint8Array) {
        return result;
      }
      
      // Convert other buffer types to Uint8Array
      if (result instanceof ArrayBuffer) {
        return new Uint8Array(result);
      }
      
      throw new Error("toBuffer did not return a valid buffer type");

    } catch (bufferErr) {
      console.error("Error using toBuffer:", bufferErr);
      throw new Error("Failed to generate PDF buffer");
    }
  }
}
