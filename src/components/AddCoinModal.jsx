"use client";

import { useState, useEffect } from "react";
import { Search, Upload, X, Loader2, CheckCircle } from "lucide-react";
import { addCoinToCollection } from "../app/actions";
import { supabase } from "../lib/supabaseClient";

export default function AddCoinModal({ onClose, initialCoin = null }) {
  // If initialCoin is provided, skip to step 2 (Upload)
  const [step, setStep] = useState(initialCoin ? 2 : 1);
  const [selectedCoin, setSelectedCoin] = useState(initialCoin);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search Logic
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live Search Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);

      // FETCH: ID, Name, Year, KM, Subject, Period Shorthand, Denomination Name
      const { data } = await supabase
        .from("f_coins")
        .select(
          "coin_id, name, year, km, subject, d_period(period_shorthand), d_denominations(denomination_name)"
        )
        .or(`name.ilike.%${searchTerm}%,km.ilike.%${searchTerm}%`)
        .limit(10);

      setSearchResults(data || []);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    formData.append("coin_id", selectedCoin.coin_id);

    const result = await addCoinToCollection(formData);

    setIsSubmitting(false);
    if (result.success) {
      alert("Success! Coin added.");
      onClose();
      window.location.reload();
    } else {
      alert("Error: " + result.error);
    }
  };

  // Helper to construct the line: Denomination • Year • KM# • Subject
  const getCoinDescription = (coin) => {
    const parts = [];

    // 1. Denomination
    if (coin.d_denominations?.denomination_name) {
      parts.push(coin.d_denominations.denomination_name);
    }

    // 2. Year
    if (coin.year) parts.push(coin.year);

    // 3. KM
    if (coin.km) parts.push(coin.km);

    // 4. Subject
    if (coin.subject) parts.push(coin.subject);

    return parts.join(" • ");
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: "500px",
          height: "auto",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <h2>Add to Collection</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: "auto" }}>
          {step === 1 ? (
            /* STEP 1: SEARCH */
            <div className="step-container">
              <div className="search-box" style={{ marginBottom: "1.5rem" }}>
                <div className="search-input-wrapper">
                  <input
                    className="search-input"
                    placeholder="Search catalog by name or KM#..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2
                      className="animate-spin"
                      size={18}
                      style={{
                        position: "absolute",
                        right: "10px",
                        color: "#9ca3af",
                      }}
                    />
                  )}
                </div>
              </div>

              <div
                className="coin-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {searchResults.map((coin) => (
                  <div
                    key={coin.coin_id}
                    onClick={() => {
                      setSelectedCoin(coin);
                      setStep(2);
                    }}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
                      {/* Name + Period */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                          {coin.name}
                        </span>
                        {coin.d_period?.period_shorthand && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#64748b",
                              fontWeight: "400",
                            }}
                          >
                            {coin.d_period.period_shorthand}
                          </span>
                        )}
                      </div>

                      {/* Description Line: Denom • Year • KM • Subject */}
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-light)",
                          marginTop: "2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {getCoinDescription(coin)}
                      </div>
                    </div>
                    <CheckCircle
                      size={16}
                      color="var(--border)"
                      style={{ flexShrink: 0 }}
                    />
                  </div>
                ))}
                {searchTerm.length > 1 &&
                  searchResults.length === 0 &&
                  !isSearching && (
                    <p
                      className="no-results"
                      style={{ padding: "1rem", textAlign: "center" }}
                    >
                      No coins found.
                    </p>
                  )}
              </div>
            </div>
          ) : (
            /* STEP 2: UPLOAD */
            <form onSubmit={handleSubmit} className="upload-step">
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    fontWeight: "700",
                    letterSpacing: "0.05em",
                  }}
                >
                  SELECTED COIN
                </span>

                {/* Header: Name + Period */}
                <h3
                  style={{
                    margin: "0.2rem 0 0.5rem 0",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span>{selectedCoin.name}</span>
                  {selectedCoin.d_period?.period_shorthand && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#64748b",
                        fontWeight: "400",
                      }}
                    >
                      {selectedCoin.d_period.period_shorthand}
                    </span>
                  )}
                </h3>

                {/* Summary Line */}
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-light)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {getCoinDescription(selectedCoin)}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--primary)",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Change Coin
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <label style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    Obverse Image (Required)
                  </span>
                  <input
                    type="file"
                    name="obverse"
                    accept="image/*"
                    required
                    className="search-input"
                    style={{ padding: "0.5rem" }}
                  />
                </label>
                <label style={{ display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                    }}
                  >
                    Reverse Image
                  </span>
                  <input
                    type="file"
                    name="reverse"
                    accept="image/*"
                    className="search-input"
                    style={{ padding: "0.5rem" }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="filter-tag"
                style={{
                  width: "100%",
                  marginTop: "2rem",
                  padding: "1rem",
                  justifyContent: "center",
                  fontSize: "1rem",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {isSubmitting ? "Uploading to Vault..." : "Upload & Save"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
