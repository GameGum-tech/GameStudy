"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function TagNavigation() {
  const searchParams = useSearchParams();
  const activeTag = searchParams.get('tag');

  return (
    <div className="tag-navigation-wrapper">
      <nav className="tag-navigation">
        <Link 
          href="/" 
          className={`tag-nav-item ${!activeTag ? 'active' : ''}`}
        >
          すべて
        </Link>
        <Link 
          href="/?tag=Roblox" 
          className={`tag-nav-item ${activeTag === 'Roblox' ? 'active' : ''}`}
        >
          Roblox
        </Link>
        <Link 
          href="/?tag=Roblox Studio" 
          className={`tag-nav-item ${activeTag === 'Roblox Studio' ? 'active' : ''}`}
        >
          Roblox Studio
        </Link>
        <Link 
          href="/?tag=3DCG" 
          className={`tag-nav-item ${activeTag === '3DCG' ? 'active' : ''}`}
        >
          3DCG
        </Link>
        <Link 
          href="/?tag=Lua" 
          className={`tag-nav-item ${activeTag === 'Lua' ? 'active' : ''}`}
        >
          Lua
        </Link>
        <Link 
          href="/?tag=レベルデザイン" 
          className={`tag-nav-item ${activeTag === 'レベルデザイン' ? 'active' : ''}`}
        >
          レベルデザイン
        </Link>
        <Link 
          href="/?tag=その他" 
          className={`tag-nav-item ${activeTag === 'その他' ? 'active' : ''}`}
        >
          その他
        </Link>
        <div className="tag-nav-divider"></div>
        <a 
          href="#" 
          target="_blank" 
          rel="noopener noreferrer"
          className="tag-nav-item external-link"
        >
          GameJam 🔗
        </a>
        <a 
          href="https://gamegum.jp" 
          target="_blank" 
          rel="noopener noreferrer"
          className="tag-nav-item external-link"
        >
          運営会社 🔗
        </a>
      </nav>
    </div>
  );
}
