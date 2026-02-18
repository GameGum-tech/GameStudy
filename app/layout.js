import "./enhanced-globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Providers from "./components/Providers";

export const metadata = {
  title: {
    default: "GameStudy - ゲーム開発学習プラットフォーム",
    template: "%s | GameStudy",
  },
  description: "ゲームに関する知識を共有し、学び合うプラットフォーム。攻略記事やレビュー、ゲーム開発の知見を投稿・閲覧できます。",
  keywords: ["ゲーム", "攻略", "レビュー", "学習", "GameStudy", "ゲーム開発", "記事投稿"],
  authors: [{ name: "GameStudy Team" }],
  creator: "GameStudy",
  publisher: "GameStudy",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  
  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "GameStudy",
    title: "GameStudy - ゲーム開発学習プラットフォーム",
    description: "ゲームに関する知識を共有し、学び合うプラットフォーム。攻略記事やレビュー、ゲーム開発の知見を投稿・閲覧できます。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GameStudy - ゲーム開発学習プラットフォーム",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "GameStudy - ゲーム開発学習プラットフォーム",
    description: "ゲームに関する知識を共有し、学び合うプラットフォーム。攻略記事やレビュー、ゲーム開発の知見を投稿・閲覧できます。",
    images: ["/twitter-image.png"],
    creator: "@gamestudy",
  },
  
  // Robots (検索エンジンのクロール制御)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // その他のメタタグ
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
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
