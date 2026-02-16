import "./enhanced-globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Providers from "./components/Providers";

export const metadata = {
  title: "GameStudy",
  description: "Next.js + PostgreSQL in Docker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
