"use client";

import React, { useEffect, useRef } from "react";
// REMOVED: import Image from "next/image";
import {
  X,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  PlusCircle,
  Search,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";

// Fetcher Function
async function fetchCoinDetails(coinId) {
  // 1. Fetch Coin & Relations
  const { data, error } = await supabase
    .from("f_coins")
    .select(
      `
      *,
      d_period!inner(period_name, period_link),
      d_series(series_name, series_link, series_range),
      d_categories(type_name),
      d_denominations(denomination_name)
    `
    )
    .eq("coin_id", coinId)
    .single();

  if (error) throw error;
  if (!data) return null;

  // 2. Robust Country Fetch (2-Step Strategy)
  let countryName = "Unknown";

  if (data.period_id) {
    try {
      // Step A: Find the Country ID for this Period
      const { data: linkData, error: linkError } = await supabase
        .from("b_periods_countries")
        .select("country_id")
        .eq("period_id", data.period_id)
        .limit(1)
        .maybeSingle();

      if (linkError) {
        console.error("Link Fetch Error:", linkError);
      } else if (linkData) {
        // Step B: Fetch the Country Name using the ID
        const { data: countryData, error: countryError } = await supabase
          .from("d_countries")
          .select("country_name")
          .eq("country_id", linkData.country_id)
          .single();

        if (countryError) {
          console.error("Country Name Error:", countryError);
        } else if (countryData) {
          countryName = countryData.country_name;
        }
      } else {
        console.warn("No country linked to period:", data.period_id);
      }
    } catch (err) {
      console.error("Unexpected error fetching country:", err);
    }
  }

  return { ...data, countryName };
}

// Helper to build srcset for Modal (Higher resolution focus)
const buildModalSrcSet = (imgObj) => {
  if (!imgObj) return undefined;
  const variants = [];
  if (imgObj.medium) variants.push(`${imgObj.medium} 600w`);
  if (imgObj.original || imgObj.full)
    variants.push(`${imgObj.original || imgObj.full} 1200w`);
  return variants.join(", ") || undefined;
};

export default function CoinModal({ coin, onClose, session, onAddCoin }) {
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Use Query
  const {
    data: details,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["coin_detail_v2", coin.coin_id],
    queryFn: () => fetchCoinDetails(coin.coin_id),
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  // Merge Data
  const displayData = details ? { ...coin, ...details } : coin;

  // Preserve local ownership/image data
  if (!displayData.is_owned) displayData.is_owned = coin.is_owned;
  if (!displayData.images) displayData.images = coin.images;

  // Link Helper
  const renderLink = (text, url) => {
    if (!url) return <span>{text || "Unknown"}</span>;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="modal-link"
        onClick={(e) => e.stopPropagation()}
      >
        {text}{" "}
        <ExternalLink size={10} style={{ marginLeft: 2, marginBottom: 1 }} />
      </a>
    );
  };

  // Image Logic
  const obverseUrl =
    displayData.images?.obverse?.full ||
    displayData.images?.obverse?.original ||
    displayData.images?.obverse?.medium;
  const reverseUrl =
    displayData.images?.reverse?.full ||
    displayData.images?.reverse?.original ||
    displayData.images?.reverse?.medium;

  // Build SrcSets
  const obverseSrcSet = buildModalSrcSet(displayData.images?.obverse);
  const reverseSrcSet = buildModalSrcSet(displayData.images?.reverse);

  // --- SMART SEARCH LOGIC START ---
  const coinName = displayData.name || "";
  const coinYear = displayData.year ? String(displayData.year) : "";

  const query = coinName.includes(coinYear)
    ? coinName
    : `${coinName} ${coinYear}`;

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    query
  )}`;
  // --- SMART SEARCH LOGIC END ---

  // SHARED STYLES for all header buttons (Owned, Search, Add)
  const actionBtnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px", // Fixed Width
    height: "36px", // Fixed Height
    borderRadius: "8px", // Rounded Square
    cursor: "pointer",
    textDecoration: "none",
    flexShrink: 0,
    transition: "transform 0.2s, background 0.2s, box-shadow 0.2s",
  };

  // Style to replace Next.js "fill" prop
  const imgFillStyle = {
    position: "absolute",
    height: "100%",
    width: "100%",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    objectFit: "cover",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div
            className="modal-title-wrapper"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              paddingRight: "1rem",
            }}
          >
            {/* 1. Title (Left) */}
            <h2 style={{ margin: 0, lineHeight: 1.2 }}>{displayData.name}</h2>

            {/* 2. Actions Group (Pushed to Far Right via marginLeft: auto) */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              }}
            >
              {/* Owned Badge (Icon Only) */}
              {displayData.is_owned && (
                <div
                  style={{
                    ...actionBtnStyle,
                    background: "#d1fae5", // --owned-green-light
                    border: "1px solid #10b981", // --owned-green
                    color: "#065f46", // --owned-green-dark
                    cursor: "default", // Not clickable
                  }}
                  title="You own this coin"
                >
                  <CheckCircle size={20} />
                </div>
              )}

              {/* Google Search Button */}
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  ...actionBtnStyle,
                  background: "#eff6ff",
                  border: "1px solid var(--primary)",
                  color: "var(--primary)",
                }}
                title="Search for this coin on Google"
              >
                <Search size={20} />
              </a>

              {/* Add Coin Button */}
              {session && !displayData.is_owned && onAddCoin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddCoin(displayData);
                  }}
                  style={{
                    ...actionBtnStyle,
                    background: "#fffbeb",
                    border: "1px solid var(--brand-gold)",
                    color: "#d97706",
                  }}
                  title="Add this coin to your collection"
                >
                  <PlusCircle size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Close Button (Separate from title wrapper) */}
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Error Banner */}
          {isError && (
            <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-lg flex items-center gap-3 border border-red-200">
              <AlertTriangle size={20} />
              <div className="flex flex-col text-sm">
                <span className="font-bold">Error loading details</span>
                <span>{error?.message || "Check console for details."}</span>
              </div>
            </div>
          )}

          {isLoading && !details ? (
            <div
              style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}
            >
              Loading full details...
            </div>
          ) : (
            <>
              {/* Images Section */}
              <div className="coin-images">
                <div className="coin-image-modal relative">
                  <h3>Obverse</h3>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "400px",
                      background: "var(--border-light)",
                      borderRadius: "var(--radius)",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      overflow: "hidden",
                    }}
                  >
                    {obverseUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={obverseUrl}
                        srcSet={obverseSrcSet}
                        sizes="(max-width: 768px) 100vw, 500px"
                        alt="Obverse"
                        style={imgFillStyle}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="modal-placeholder">No Image</div>
                    )}
                  </div>
                </div>
                <div className="coin-image-modal relative">
                  <h3>Reverse</h3>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "400px",
                      background: "var(--border-light)",
                      borderRadius: "var(--radius)",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      overflow: "hidden",
                    }}
                  >
                    {reverseUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reverseUrl}
                        srcSet={reverseSrcSet}
                        sizes="(max-width: 768px) 100vw, 500px"
                        alt="Reverse"
                        style={imgFillStyle}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="modal-placeholder">No Image</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="coin-details-grid three-col">
                <div className="detail-group">
                  <h3>Identification</h3>
                  <div className="detail-item">
                    <strong>Coin ID:</strong>{" "}
                    <span className="detail-value">{displayData.coin_id}</span>
                  </div>
                  <div className="detail-item">
                    <strong>KM#:</strong>{" "}
                    <span className="detail-value">
                      {displayData.km || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Denomination:</strong>{" "}
                    <span className="detail-value">
                      {displayData.d_denominations?.denomination_name ||
                        "Unknown"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Year:</strong>
                    <span className="detail-value">
                      {displayData.year || "?"}
                      {displayData.d_series?.series_range && (
                        <span className="series-range">
                          {" "}
                          ({displayData.d_series.series_range})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="detail-group">
                  <h3>Groups</h3>
                  <div className="detail-item link-item">
                    <strong>Series:</strong>
                    <span className="detail-value">
                      {renderLink(
                        displayData.d_series?.series_name,
                        displayData.d_series?.series_link
                      )}
                    </span>
                  </div>
                  <div className="detail-item link-item">
                    <strong>Period:</strong>
                    <span className="detail-value">
                      {renderLink(
                        displayData.d_period?.period_name,
                        displayData.d_period?.period_link
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Country:</strong>{" "}
                    <span className="detail-value">
                      {displayData.countryName ||
                        (isError ? "Error" : "Unknown")}
                    </span>
                  </div>
                </div>

                <div className="detail-group">
                  <h3>Extra</h3>
                  <div className="detail-item">
                    <strong>Subject:</strong>{" "}
                    <span className="detail-value">
                      {displayData.subject || "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Price (USD):</strong>
                    <span className="detail-value price-tag">
                      {displayData.price_usd
                        ? `$${displayData.price_usd.toFixed(2)}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Marked:</strong>
                    <span className="detail-value">
                      {displayData.marked ? (
                        <span className="badge-true">Yes</span>
                      ) : (
                        <span className="badge-false">No</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
