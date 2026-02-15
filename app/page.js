"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [status, setStatus] = useState("not checked");
  const [loading, setLoading] = useState(false);

  const checkDb = async () => {
    setLoading(true);
    setStatus("checking...");
    try {
      const res = await fetch("/api/db", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "request failed");
      }
      setStatus(`ok: ${data.db}`);
    } catch (error) {
      setStatus(`error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="card">
        <h1>GameStudy</h1>
        <p>Next.js + PostgreSQL (Docker)</p>
        
        <div className="features">
          <Link href="/articles" className="feature-link">
            📚 記事一覧
          </Link>
          <button onClick={checkDb} disabled={loading} className="feature-button">
            🔍 DB接続確認
          </button>
        </div>
        
        <p className="status">{status}</p>
      </div>
    </main>
  );
}
