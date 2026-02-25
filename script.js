function randomHexColor() {
    const n = Math.floor(Math.random() * 0xffffff);
    return "#" + n.toString(16).padStart(6, "0").toUpperCase();
}

function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);

    return { r, g, b };
}

function relativeLuminance({ r, g, b }) {
    const srgb = [r, g, b].map((v) => v /= 255);

    const linear = srgb.map((v) => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.0555) / 1.055, 2.4);
    });

    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(hex1, hex2) {
    const L1 = relativeLuminance(hexToRgb(hex1));
    const L2 = relativeLuminance(hexToRgb(hex2));

    const light = Math.max(L1, L2);
    const dark = Math.min(L1, L2);

    return (light + 0.05) / (dark + 0.05);
}

function bestTextColor(bgHex) {
    const white = "#FFFFFF";
    const black = "#000000";

    const contrastWithWhite = contrastRatio(bgHex, white);
    const contrastWithBlack = contrastRatio(bgHex, black);

    if (contrastWithBlack >= contrastWithWhite) {
        return { text: black, ratio: contrastWithBlack };
    } else {
        return { text: white, ratio: contrastWithWhite };
    }
}




function wcagPasses(ratio) {
    return {
        normalAA: ratio >= 4.5,
        normalAAA: ratio >= 7,
        largeAA: ratio >= 3,
        largeAAA: ratio >= 4.5
    }
}

// ===========================
// Generate secondary
// ===========================

function rgbToHsl({ r, g, b }) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));

        switch (max) {
        case r:
            h = ((g - b) / d) % 6;
            break;
        case g:
            h = (b - r) / d + 2;
            break;
        case b:
            h = (r - g) / d + 4;
            break;
        }

        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }

    return { h, s, l };
}

function hslToRgb({ h, s, l }) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r1 = 0,
        g1 = 0,
        b1 = 0;

    if (0 <= h && h < 60) [r1, g1, b1] = [c, x, 0];
    else if (60 <= h && h < 120) [r1, g1, b1] = [x, c, 0];
    else if (120 <= h && h < 180) [r1, g1, b1] = [0, c, x];
    else if (180 <= h && h < 240) [r1, g1, b1] = [0, x, c];
    else if (240 <= h && h < 300) [r1, g1, b1] = [x, 0, c];
    else if (300 <= h && h < 360) [r1, g1, b1] = [c, 0, x];

    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);

    return { r, g, b };
}

function rgbToHex({ r, g, b }) {
    const toHex = (v) => v.toString(16).padStart(2, "0").toUpperCase();
    return "#" + toHex(r) + toHex(g) + toHex(b);
}

function generateSupportingColor(primaryHex) {
    const base = rgbToHsl(hexToRgb(primaryHex));

    const offsets = [150, 180, 210];
    const h = (base.h + offsets[Math.floor(Math.random() * offsets.length)]) % 360;

    const s = Math.min(0.65, Math.max(0.35, base.s * 0.7));

    let l;
    if (base.l >= 0.5) {
        l = Math.random() * 0.25 + 0.15;
    } else {
        l = Math.random() * 0.25 + 0.65;
    }

    return rgbToHex(hslToRgb({ h, s, l }));
}

function generatePrimaryUntilReadable() {
    let primary = "";

    while (true) {
        primary = randomHexColor();

        const best = bestTextColor(primary);
        const { normalAA, normalAAA, largeAA, largeAAA } = wcagPasses(best.ratio);

        if (normalAA && normalAAA && largeAA && largeAAA) return primary;
    }
}

function generateSecondaryUntilReadable(primaryHex, minContrast = 7, maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
        const secondary = generateSupportingColor(primaryHex);

        const colorContrast = contrastRatio(primaryHex, secondary);

        if (colorContrast >= minContrast) {
            return secondary;
        }
    }

    const primaryTextColor = bestTextColor(primaryHex).text;
    return primaryTextColor === "#000000" ? "#202748" : "#E9EFDA";
}

// =============================
// Render functions
// =============================
function renderColorPalette(primaryHexCardEl, secondaryHexCardEl, primaryTextEl, secondaryTextEl, primaryColor, secondaryColor) {
    primaryHexCardEl.style.backgroundColor = primaryColor;
    primaryTextEl.textContent = "Hex: " + primaryColor;
    primaryPickerEl.value = primaryColor;

    secondaryHexCardEl.style.backgroundColor = secondaryColor;
    secondaryTextEl.textContent = "Hex: " + secondaryColor;
    secondaryPickerEl.value = secondaryColor;
}

function renderVisualization(viz1, viz2, currentPrimary, currentSecondary) {
    const primaryTextColor = bestTextColor(currentPrimary).text;
    const secondaryTextColor = bestTextColor(currentSecondary).text;

    document.querySelector("#viz1 h2").style.color = currentSecondary;
    document.querySelector("#viz2 h2").style.color = currentPrimary;
    document.querySelector("#viz3 h2").style.color = currentPrimary;
    document.querySelector("#viz4 h2").style.color = currentSecondary;

    viz1.style.color = primaryTextColor;
    viz2.style.color = secondaryTextColor;

    viz1.style.backgroundColor = currentPrimary;
    viz2.style.backgroundColor = currentSecondary;
}

function renderWcagResult(normalAAEl, normalAAAEl, largeAAEl, largeAAAEl, primary, secondary) {
    const PASS_COLOR = "#449b72";
    const FAIL_COLOR = "#c3110c";

    const result = wcagPasses(contrastRatio(primary, secondary));

    console.log("Contrast ratio: ", contrastRatio(primary, secondary).toFixed(2) + ":1");

    const checks = [ 
        { el: normalAAEl, key: "normalAA" },
        { el: normalAAAEl, key: "normalAAA" },
        { el: largeAAEl, key: "largeAA" },
        { el: largeAAAEl, key: "largeAAA" }
    ];

    checks.forEach(({ el, key }) => {
        const pass = result[key];

        el.textContent = pass ? "PASS" : "FAIL";
        el.style.color = pass ? PASS_COLOR : FAIL_COLOR;
        el.style.fontWeight = "700";
    });
}

// ===================================
// DOM Elements
// ===================================

const primaryHexCardEl = document.getElementById("primaryColor");
const primaryTextEl = document.getElementById("primaryHex");

const primaryPickerEl = document.getElementById("primaryPicker");
const secondaryPickerEl = document.getElementById("secondaryPicker");

const secondaryHexCardEl = document.getElementById("secondaryColor");
const secondaryTextEl = document.getElementById("secondaryHex");

const lockPrimaryEl = document.getElementById("lockPrimary");
const generateBtn = document.getElementById("generateBtn");

const viz1 = document.getElementById("viz1");
const viz2 = document.getElementById("viz2");

const normalAAEl = document.getElementById("normalAA");
const normalAAAEl = document.getElementById("normalAAA");
const largeAAEl = document.getElementById("largeAA");
const largeAAAEl = document.getElementById("largeAAA");

// =============================
// Render color palette
// =============================
let currentPrimary = generatePrimaryUntilReadable();
let currentSecondary = generateSecondaryUntilReadable(currentPrimary);

function generatePalette() {
    const lock = lockPrimaryEl.checked;

    if (!lock) {
        currentPrimary = generatePrimaryUntilReadable();
    }

    currentSecondary = generateSecondaryUntilReadable(currentPrimary);

    renderColorPalette(primaryHexCardEl, secondaryHexCardEl, primaryTextEl, secondaryTextEl, currentPrimary, currentSecondary);
    renderVisualization(viz1, viz2, currentPrimary, currentSecondary);
    renderWcagResult(normalAAEl, normalAAAEl, largeAAEl, largeAAAEl, currentPrimary, currentSecondary);
}


generateBtn.addEventListener("click", generatePalette);

primaryPickerEl.addEventListener("input", (e) => {
    currentPrimary = e.target.value.toUpperCase();

    renderColorPalette(primaryHexCardEl, secondaryHexCardEl, primaryTextEl, secondaryTextEl, currentPrimary, currentSecondary);
    renderVisualization(viz1, viz2, currentPrimary, currentSecondary);
    renderWcagResult(normalAAEl, normalAAAEl, largeAAEl, largeAAAEl, currentPrimary, currentSecondary);
});

secondaryPickerEl.addEventListener("input", (e) => {
    currentSecondary = e.target.value.toUpperCase();

    renderColorPalette(primaryHexCardEl, secondaryHexCardEl, primaryTextEl, secondaryTextEl, currentPrimary, currentSecondary);
    renderVisualization(viz1, viz2, currentPrimary, currentSecondary);
    renderWcagResult(normalAAEl, normalAAAEl, largeAAEl, largeAAAEl, currentPrimary, currentSecondary);
});

generatePalette();