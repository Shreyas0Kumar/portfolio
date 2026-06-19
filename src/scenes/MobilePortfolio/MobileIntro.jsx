import React, { useState } from "react";
import { usePortfolio } from "../../data/portfolio.jsx";
import "./MobileIntro.css";

/**
 * MobileIntro
 * Handoff "magazine cover" for phone/tablet visitors: the real portfolio is an
 * interactive desktop experience, so this front page (matching the printed-edition
 * theme) nudges them to open it on a laptop — while offering a one-tap "copy link"
 * and a clear way to continue to the lightweight scrollable version.
 *
 * Content is read from public/portfolio.json (profile + cover image), so editing
 * the JSON updates this screen with no code changes.
 *
 * Props:
 *   onContinue {function} — proceed to the scrollable mobile portfolio
 */
const SITE_URL = "portfolio.shreyas.space";

export default function MobileIntro({ onContinue }) {
  const data = usePortfolio();
  const pr = data.profile || {};
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${SITE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the URL is shown in the chip as a fallback */
    }
  };

  const byline = [pr.role, pr.location].filter(Boolean).join("  ·  ");

  return (
    <div className="mintro-viewport">
      <div className="mintro">
        {/* ── Masthead / folio ── */}
        <header className="mintro-masthead">
          <div className="mintro-folio">
            <span>The Portfolio &nbsp;·&nbsp; No.01 &nbsp;·&nbsp; {new Date().getFullYear()}</span>
            <span className="mintro-status"><i className="mintro-dot" />Open to work</span>
          </div>
          <div className="mintro-title-block">
            <h1 className="mintro-name">{pr.name}</h1>
            {byline && <div className="mintro-byline">{byline}</div>}
            {pr.tagline && <p className="mintro-deck">{pr.tagline}</p>}
          </div>
        </header>

        {/* ── Cover image frame ── */}
        <div className="mintro-cover">
          {pr.coverImage && (
            <img className="mintro-cover-img" src={pr.coverImage} alt="" loading="eager" />
          )}
          {/* <span className="mintro-cover-num">01</span> */}
          <div className="mintro-cover-caption">
            <div className="mintro-cover-kicker">Cover Story &nbsp;·&nbsp; Desktop Edition</div>
            <div className="mintro-cover-title">an interactive<br />desktop world</div>
          </div>
          <span className="mintro-stamp">Best on{"\n"}Desktop</span>
        </div>

        {/* ── Body ── */}
        <div className="mintro-body">
          <p className="mintro-eyebrow">A note before you scroll</p>
          <h2 className="mintro-display">This portfolio was built for a laptop.</h2>

          <div className="mintro-lede">
            <p className="mintro-lede-line">
              The full experience boots into a 3D room, a working macOS you can click
              around in, with apps, a desktop, and everything in between.
            </p>
            <p className="mintro-lede-line mintro-lede-line--soft">
              It doesn&apos;t translate well to a phone screen, so open it on a laptop when
              you get a chance. A scrollable edition is available here in the meantime.
            </p>
          </div>

          <div className="mintro-url">
            <span>{SITE_URL}</span>
            <span className="mintro-url-tag">desktop</span>
          </div>

          <div className="mintro-rule">
            <h3 className="mintro-kicker">Actions</h3>
          </div>

          <div className="mintro-actions">
            <button type="button" className="mintro-copy" onClick={copyLink}>
              {copied ? "link copied ✓" : "copy link for desktop"}
            </button>
            <button type="button" className="mintro-continue" onClick={onContinue}>
              continue on mobile &nbsp;→
            </button>
          </div>

          <p className="mintro-note">
            A scrollable version works fine — you won&apos;t miss the gist.
          </p>
        </div>
      </div>
    </div>
  );
}
