"use client";
import React, { memo } from "react";
import { Calendar, DollarSign, Hash, CheckCircle } from "lucide-react";
import FadeInImage from "./FadeInImage";

// Helper to build srcset string (lighter version for list items)
const buildListSrcSet = (imgObj) => {
  if (!imgObj) return undefined;
  const variants = [];
  // Prioritize thumb for list view
  if (imgObj.thumb) variants.push(`${imgObj.thumb} 150w`);
  if (imgObj.medium) variants.push(`${imgObj.medium} 600w`);
  return variants.join(", ") || undefined;
};

const CoinListItem = memo(function CoinListItem({ coin, onClick }) {
  const obverseUrl =
    coin.images?.obverse?.thumb || coin.images?.obverse?.medium;
  const reverseUrl =
    coin.images?.reverse?.thumb || coin.images?.reverse?.medium;

  const obverseSrcSet = buildListSrcSet(coin.images?.obverse);
  const reverseSrcSet = buildListSrcSet(coin.images?.reverse);

  const denomination = coin.d_denominations?.denomination_name;

  return (
    <div
      className={`coin-list-item ${coin.is_owned ? "owned" : ""}`}
      onClick={() => onClick(coin)}
    >
      {/* 1. DUAL IMAGES (Obverse + Reverse) */}
      <div className="list-images-container">
        <div className="list-img-wrapper relative">
          {obverseUrl ? (
            <FadeInImage
              src={obverseUrl}
              srcSet={obverseSrcSet}
              // List items are always small (~80px)
              sizes="80px"
              alt="Obv"
              fill
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="list-item-placeholder">No Obv</div>
          )}
        </div>
        <div className="list-img-wrapper relative">
          {reverseUrl ? (
            <FadeInImage
              src={reverseUrl}
              srcSet={reverseSrcSet}
              sizes="80px"
              alt="Rev"
              fill
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="list-item-placeholder">No Rev</div>
          )}
        </div>
      </div>

      {/* 2. CONTENT */}
      <div className="list-item-content">
        <div className="list-item-header">
          <h3 className="list-item-title">{coin.name}</h3>
          {denomination && (
            <span className="list-item-denom">{denomination}</span>
          )}
        </div>

        <div className="list-item-meta">
          <div className="meta-tag">
            <Calendar size={12} />
            <span>{coin.year || "ND"}</span>
          </div>

          {coin.km && (
            <div className="meta-tag">
              <Hash size={12} />
              <span>{coin.km}</span>
            </div>
          )}

          <div className="meta-tag mobile-hidden">
            <span>{coin.d_series?.series_name}</span>
          </div>
        </div>
      </div>

      {/* 3. ACTIONS / STATUS */}
      <div className="list-item-actions">
        {coin.is_owned && (
          <div className="list-owned-status">
            <CheckCircle size={16} />
            <span>Owned</span>
          </div>
        )}
        <div className="list-price">
          <DollarSign size={14} />
          <span>{coin.price_usd ? coin.price_usd.toFixed(2) : "---"}</span>
        </div>
      </div>
    </div>
  );
});

export default CoinListItem;
