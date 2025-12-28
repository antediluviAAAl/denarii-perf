"use client";

import React, { useMemo, useState, memo } from "react";
import { Check, X, Minus } from "lucide-react";

// --- MEMOIZED MATRIX COMPONENT ---
const CoinMatrix = memo(function CoinMatrix({
  years,
  denominations, // Now array of objects { name, shorthand }
  matrix,
  hoverState,
  onCoinClick,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}) {
  return (
    <table className="coin-matrix-table">
      <thead>
        <tr>
          <th className="sticky-col-left">Year</th>
          {denominations.map((d) => (
            <th key={d.name}>
              {/* Header Logic: Name on Desktop, Shorthand on Mobile */}
              <span className="denom-label-desktop">{d.name}</span>
              <span className="denom-label-mobile">
                {d.shorthand || d.name}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {years.map((year) => (
          <tr key={year}>
            <td className="sticky-col-left year-cell">
              {year > 0 ? year : "ND"}
            </td>

            {denominations.map((d) => {
              const denomName = d.name;
              const cellCoins = matrix[`${year}-${denomName}`];
              const hasCoins = cellCoins && cellCoins.length > 0;
              const isMixed =
                hasCoins &&
                cellCoins.some((c) => c.is_owned) &&
                cellCoins.some((c) => !c.is_owned);
              const allOwned = hasCoins && cellCoins.every((c) => c.is_owned);

              // Determine if we have multiple coins in this specific cell
              const isMultiCoin = hasCoins && cellCoins.length > 1;

              let cellClass = "empty";
              if (allOwned) cellClass = "owned-cell";
              else if (isMixed) cellClass = "mixed-cell";
              else if (hasCoins) cellClass = "unowned-cell";

              return (
                <td
                  key={`${year}-${denomName}`}
                  className={`matrix-cell ${cellClass}`}
                >
                  {hasCoins ? (
                    <div className="multi-coin-container">
                      {cellCoins.map((coin, index) => {
                        const isSeriesHighlighted =
                          hoverState.seriesId &&
                          coin.series_id === hoverState.seriesId;

                        const isDimmed =
                          hoverState.seriesId && !isSeriesHighlighted;

                        // LABEL LOGIC:
                        // 1. If multiple coins: ALWAYS show subject (truncated) to distinguish
                        // 2. If single coin:
                        //    - Desktop: Show Denomination Name
                        //    - Mobile: Show Denomination Shorthand
                        
                        let labelDesktop, labelMobile;

                        if (isMultiCoin) {
                          // Case: Stack of coins -> Show Subject
                          const subj = coin.subject
                            ? coin.subject.substring(0, 8)
                            : denomName;
                          labelDesktop = subj;
                          labelMobile = subj;
                        } else {
                          // Case: Single coin -> Show Denomination
                          labelDesktop = denomName;
                          labelMobile = d.shorthand || denomName;
                        }

                        return (
                          <div
                            key={coin.coin_id}
                            className={`coin-item-wrapper ${
                              coin.is_owned ? "owned" : "unowned"
                            } ${
                              isSeriesHighlighted ? "series-highlight" : ""
                            } ${isDimmed ? "dimmed" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCoinClick(coin);
                            }}
                            onMouseEnter={(e) => onMouseEnter(e, coin)}
                            onMouseMove={onMouseMove}
                            onMouseLeave={onMouseLeave}
                          >
                            <div className="coin-item-content">
                              {/* Desktop Label */}
                              <span className="cell-denom-label denom-label-desktop">
                                {labelDesktop}
                              </span>

                              {/* Mobile Label */}
                              <span className="cell-denom-label denom-label-mobile">
                                {labelMobile}
                              </span>

                              {coin.is_owned ? (
                                <Check size={16} strokeWidth={3} />
                              ) : (
                                <X size={16} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="cell-empty">
                      <Minus size={12} />
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default function CoinTable({ coins, onCoinClick }) {
  // --- STATE ---
  const [hoverState, setHoverState] = useState({
    coin: null,
    seriesId: null,
    x: 0,
    y: 0,
  });

  // --- DATA PIVOT ---
  const { years, denominations, matrix } = useMemo(() => {
    const yearsSet = new Set();
    const denomMap = new Map(); // Store objects { name, shorthand }
    const lookup = {};

    coins.forEach((coin) => {
      const y = coin.year || 0;
      const dName = coin.d_denominations?.denomination_name || "Unknown";
      const dShort = coin.d_denominations?.denomination_shorthand || "";

      yearsSet.add(y);
      // Only set if not already present to avoid duplicates
      if (!denomMap.has(dName)) {
        denomMap.set(dName, { name: dName, shorthand: dShort });
      }

      const key = `${y}-${dName}`;
      if (!lookup[key]) {
        lookup[key] = [];
      }
      lookup[key].push(coin);
    });

    Object.keys(lookup).forEach((key) => {
      lookup[key].sort((a, b) => {
        if (a.is_owned === b.is_owned) {
          return (a.subject || "").localeCompare(b.subject || "");
        }
        return b.is_owned - a.is_owned;
      });
    });

    const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
    
    // Sort denominations numerically then alphabetically
    const sortedDenoms = Array.from(denomMap.values()).sort((a, b) => {
      const numA = parseFloat(a.name) || 0;
      const numB = parseFloat(b.name) || 0;
      if (numA !== numB) return numA - numB;
      return a.name.localeCompare(b.name);
    });

    return {
      years: sortedYears,
      denominations: sortedDenoms, // Array of objects
      matrix: lookup,
    };
  }, [coins]);

  // --- HANDLERS ---
  const handleMouseEnter = (e, coin) => {
    const { clientX, clientY } = e;
    setHoverState({
      coin,
      seriesId: coin.series_id,
      x: clientX,
      y: clientY,
    });
  };

  const handleMouseMove = (e) => {
    if (hoverState.coin) {
      setHoverState((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
      }));
    }
  };

  const handleMouseLeave = () => {
    setHoverState({
      coin: null,
      seriesId: null,
      x: 0,
      y: 0,
    });
  };

  if (coins.length === 0) return null;

  const getTooltipImage = (side) => {
    if (!hoverState.coin) return null;
    return hoverState.coin.images?.[side]?.thumb;
  };

  const tooltipObverse = getTooltipImage("obverse");
  const tooltipReverse = getTooltipImage("reverse");

  return (
    <div className="coin-table-wrapper">
      <div className="coin-table-container">
        <CoinMatrix
          years={years}
          denominations={denominations}
          matrix={matrix}
          hoverState={hoverState}
          onCoinClick={onCoinClick}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {hoverState.coin && (
        <div
          className="coin-hover-tooltip"
          style={{
            top: hoverState.y + 15,
            left: hoverState.x + 15,
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-title">{hoverState.coin.name}</span>
            <span className="tooltip-series">
              {hoverState.coin.d_series?.series_range || "Unknown Range"}
            </span>
          </div>
          <div className="tooltip-images">
            {tooltipObverse ? (
              <img
                src={tooltipObverse}
                alt="Obverse"
                className="tooltip-img"
              />
            ) : (
              <div className="tooltip-placeholder">No Obv</div>
            )}
            {tooltipReverse ? (
              <img
                src={tooltipReverse}
                alt="Reverse"
                className="tooltip-img"
              />
            ) : (
              <div className="tooltip-placeholder">No Rev</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}