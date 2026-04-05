"use client";

import {
  BlobProvider,
  Document,
  Page,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 30,
    textAlign: "right",
    fontFamily: "Helvetica",
  },
  header: { fontSize: 24, marginBottom: 20, color: "#3b82f6" },
});

const QuotePdf = ({ data }: { data: { clientName: string; amount: number } }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>הצעת מחיר — BSD-YBM</Text>
      <Text>לכבוד: {data.clientName}</Text>
      <Text>תאריך מסמך: {new Date().toLocaleDateString("he-IL")}</Text>
      <Text style={{ marginTop: 12, fontSize: 12 }}>
        1) תיאור ההצעה: שירותי פלטפורמת BSD-YBM (סריקת מסמכים, ארגון נתונים ודוחות) לפי היקף שנקבע
        מול הלקוח.
      </Text>
      <Text style={{ fontSize: 12 }}>
        2) סכום לפני מע״מ: ₪{data.amount.toLocaleString()} — מע״מ לפי חוק.
      </Text>
      <Text style={{ fontSize: 12 }}>3) תוקף ההצעה: 30 יום ממועד המסמך.</Text>
      <Text style={{ fontSize: 12 }}>4) תנאי תשלום: נקבע בחתימה על הסכם או בהזמנת שירות.</Text>
      <Text style={{ fontSize: 12, marginTop: 8, fontStyle: "italic" }}>
        5) חתימות: ________________ (לקוח) · ________________ (ספק)
      </Text>
    </Page>
  </Document>
);

export default function QuoteGenerator({
  quoteData,
}: {
  quoteData: { clientName: string; amount: number };
}) {
  return (
    <BlobProvider document={<QuotePdf data={quoteData} />}>
      {({ url, loading, error }) => (
        <a
          href={url ?? undefined}
          download={url ? "quote.pdf" : undefined}
          className="bg-indigo-600 px-3 py-2 rounded-lg text-sm text-white inline-block"
          aria-disabled={loading || !url}
          onClick={(e) => {
            if (!url || loading) e.preventDefault();
          }}
        >
          {error
            ? "שגיאה ביצירת PDF"
            : loading
              ? "מייצר PDF..."
              : "הורד הצעת מחיר"}
        </a>
      )}
    </BlobProvider>
  );
}

