"use client";

import React from "react";
// REMOVED: import Image from "next/image";
import Link from "next/link";
import { Database, CheckCircle, PlusCircle, LogIn, LogOut } from "lucide-react";

export default function Header({
  ownedCount = 0,
  displayCount = 0,
  totalCoins = 264962,
  onAddCoin,
  session,
  onLogout,
}) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">
            <div className="app-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                width="100"
                height="100"
                alt="Logo"
                style={{ display: "block" }}
              />
            </div>
            <span className="title-denarii">Denarii</span>
            <span className="title-district"> District</span>
          </h1>

          <div className="app-subtitle">
            <Database size={16} className="text-gold" />
            <span style={{ fontWeight: 600 }}>
              {totalCoins.toLocaleString()} coins in database
            </span>

            {ownedCount > 0 && (
              <span className="owned-count">
                <CheckCircle size={14} />
                {ownedCount} owned
              </span>
            )}
          </div>
        </div>

        <div className="header-stats">
          {session ? (
            <>
              {/* Add Coin Button */}
              {onAddCoin && (
                <button
                  onClick={onAddCoin}
                  className="header-action-btn"
                  title="Add a new coin"
                >
                  <PlusCircle size={20} className="text-gold" />
                  <span className="stat-value">Add Coin</span>
                </button>
              )}

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                className="header-action-btn"
                title="Sign Out"
              >
                <LogOut size={20} className="text-gold" />
                <span className="stat-value">Sign Out</span>
              </button>
            </>
          ) : (
            /* Sign In Button */
            <Link 
              href="/login" 
              className="header-action-btn" 
              title="Sign In"
            >
              <LogIn size={20} className="text-gold" />
              <span className="stat-value">Sign In</span>
            </Link>
          )}

          <div className="stat-badge">
            <span className="stat-label">Showing</span>
            <span className="stat-value">
              {(displayCount || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}