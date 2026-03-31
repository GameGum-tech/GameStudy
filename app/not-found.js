import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 720, margin: "80px auto", padding: "0 16px", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "12px" }}>404</h1>
      <p style={{ marginBottom: "20px" }}>ページが見つかりませんでした。</p>
      <Link href="/">トップページに戻る</Link>
    </main>
  );
}
