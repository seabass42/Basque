"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Green-themed Pill Navigation inspired by React Bits (JS + Tailwind)
export default function PillNav() {
  const pathname = usePathname() || "/";

  const items = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn-more" },
    { label: "Quiz", href: "/quiz" },
    { label: "Results", href: "/results" },
    { label: "Dashboard", href: "/dashboard"}
  ];

  let activeIndex = items.findIndex((i) => i.href === pathname);
  if (activeIndex === -1) {
    const pref = items.findIndex(
      (i) => i.href !== "/" && pathname.startsWith(i.href)
    );
    activeIndex = pref === -1 ? 0 : pref;
  }

  // Theme colors
  const pillColor = "#16a34a"; // green-600 pill background
  const pillTextColor = "#ffffff"; // text color on the pill
  const hoverPillColor = "#15803d"; // green-700 for darker hover

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef([]);
  const tlRefs = useRef([]);
  const activeTweenRefs = useRef([]);
  const mobileMenuRef = useRef(null);
  const navItemsRef = useRef(null);
  const logoRef = useRef(null);
  const hamburgerRef = useRef(null);

  // Layout + timeline setup
  useEffect(() => {
    const ease = "power3.easeOut";

    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return;
        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(
          R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))
        ) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        const label = pill.querySelector(".pill-label");
        const hoverLabel = pill.querySelector(".pill-label-hover");

        if (label) gsap.set(label, { y: 0 });
        if (hoverLabel) gsap.set(hoverLabel, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(
          circle,
          { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" },
          0
        );

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: "auto" }, 0);
        }

        if (hoverLabel) {
          gsap.set(hoverLabel, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(
            hoverLabel,
            { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" },
            0
          );
        }

        tlRefs.current[index] = tl;
      });

      // Ensure the active item shows the filled pill state on load
      if (activeIndex > -1 && tlRefs.current[activeIndex]) {
        // Use RAF to defer until after layout
        requestAnimationFrame(() => {
          tlRefs.current[activeIndex]?.progress(1);
        });
      }
    };

    layout();

    const onResize = () => layout();
    window.addEventListener("resize", onResize);

    if (document.fonts?.ready) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) {
      gsap.set(menu, { visibility: "hidden", opacity: 0, scaleY: 1, y: 0 });
    }

    // Subtle initial load animation
    const logo = logoRef.current;
    const navItems = navItemsRef.current;

    if (logo) {
      gsap.set(logo, { scale: 0.9, opacity: 0 });
      gsap.to(logo, { scale: 1, opacity: 1, duration: 0.4, ease });
    }

    if (navItems) {
      gsap.set(navItems, { width: 0, overflow: "hidden" });
      gsap.to(navItems, { width: "auto", duration: 0.6, ease });
    }

    return () => window.removeEventListener("resize", onResize);
  }, [activeIndex]);

  const handleEnter = (i) => {
    const ease = "power3.easeOut";
    const tl = tlRefs.current[i];
    if (!tl) return;
    // Darken background color on hover
    const circle = circleRefs.current[i];
    if (circle) {
      gsap.to(circle, { backgroundColor: hoverPillColor, duration: 0.2, ease });
    }
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: "auto",
    });
  };

  const handleLeave = (i) => {
    const ease = "power3.easeOut";
    // Revert background color when leaving
    const circle = circleRefs.current[i];
    if (circle) {
      gsap.to(circle, { backgroundColor: pillColor, duration: 0.2, ease });
    }
    if (i === activeIndex) {
      // Keep the active tab "filled" but ensure color reverts
      return;
    }
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: "auto",
    });
  };

  const toggleMobileMenu = () => {
    const ease = "power3.easeOut";
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll(".hamburger-line");
      if (newState) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (newState) {
        gsap.set(menu, { visibility: "visible" });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: "top center",
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: "top center",
          onComplete: () => {
            gsap.set(menu, { visibility: "hidden" });
          },
        });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-green-300/40 bg-green-600/15">
      <div className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div ref={logoRef} className="flex items-center gap-2 select-none">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold">
              B
            </span>
            <span className="text-lg font-semibold text-emerald-800">Basque</span>
          </div>

          {/* Desktop Nav */}
          <nav
            ref={navItemsRef}
            className="relative hidden rounded-full bg-green-600/10 p-1 shadow-inner sm:block"
            aria-label="Primary"
          >
            <ul className="flex items-center gap-1">
              {items.map((item, idx) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onMouseEnter={() => handleEnter(idx)}
                    onMouseLeave={() => handleLeave(idx)}
                    className={`relative block overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-white ${
                      pathname === item.href ? "text-white" : "text-emerald-800"
                    }`}
                  >
                    {/* Static active background pill */}
                    {pathname === item.href && (
                      <span
                        className="absolute inset-0 -z-10 rounded-full bg-green-600"
                        aria-hidden="true"
                      />
                    )}

                    {/* Expanding circle (pill) */}
                    <span
                      ref={(el) => (circleRefs.current[idx] = el)}
                      className="pointer-events-none absolute left-1/2 top-0 -z-10 rounded-full"
                      style={{ backgroundColor: pillColor }}
                      aria-hidden="true"
                    />

                    {/* Default label (below) */}
                    <span className="pill-label relative block">{item.label}</span>

                    {/* Hover label (on pill) */}
                    <span
                      className="pill-label-hover absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                      style={{ color: pillTextColor }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Hamburger */}
          <button
            ref={hamburgerRef}
            onClick={toggleMobileMenu}
            className="sm:hidden inline-flex flex-col items-center justify-center rounded-md border border-green-200 bg-white p-2 text-emerald-800 shadow-sm"
            aria-label="Toggle menu"
          >
            <span className="hamburger-line block h-0.5 w-5 bg-emerald-800" />
            <span className="hamburger-line mt-1 block h-0.5 w-5 bg-emerald-800" />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          ref={mobileMenuRef}
          className="sm:hidden mt-3 rounded-full border border-green-200 bg-white p-2 shadow"
        >
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-full px-3 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? "bg-green-600 text-white"
                      : "text-emerald-800 hover:bg-green-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}