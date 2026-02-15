import "./globals.css";

export const metadata = {
  title: "GameStudy",
  description: "Next.js + PostgreSQL in Docker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
