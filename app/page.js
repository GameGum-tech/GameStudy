"use client";

import { Suspense } from "react";
import ArticleList from "./components/ArticleList";

export default function ArticleListPage() {
  return (
    <div className="note-style-page">
      <Suspense fallback={
        <main className="container">
          <div className="main-layout">
            <aside className="left-nav">
              <ul>
                <li className="active"><a href="#">すべて</a></li>
                <li><a href="#">投稿企画</a></li>
                <li><a href="#">急上昇</a></li>
              </ul>
            </aside>
            <div className="content-area">
              <h2 className="section-title">今日の注目記事</h2>
              <div className="loading">読み込み中...</div>
            </div>
          </div>
        </main>
      }>
        <ArticleList />
      </Suspense>
    </div>
  );
}