"""
OpenRTL — svg.py : dependency-free SVG infographic renderer.

Generates publication-quality charts (bar, donut, stacked, line, gauge,
histogram) as inline SVG strings. No third-party libraries are required, so
the report engine runs anywhere Python 3 runs. All output uses a clean,
print-safe style with embedded fonts.

Every function returns a full standalone `<svg>` document and accepts a
`title`, `subtitle` and `note` for annotation.
"""

from __future__ import annotations

import html
from dataclasses import dataclass, field
from typing import Iterable, Sequence

# ---------------------------------------------------------------------------
# palette
# ---------------------------------------------------------------------------
BLUE = "#2563eb"
CYAN = "#06b6d4"
GREEN = "#16a34a"
AMBER = "#f59e0b"
RED = "#dc2626"
VIOLET = "#7c3aed"
GRAY = "#6b7280"
GRID = "#e5e7eb"
TEXT = "#111827"

PALETTE = [BLUE, CYAN, GREEN, AMBER, VIOLET, RED, "#0891b2", "#65a30d", "#db2777", "#9333ea"]


@dataclass
class Box:
    """Simple fixed-coordinate SVG drawing surface."""

    width: int
    height: int
    margin: dict = field(default_factory=lambda: {"top": 64, "right": 24, "bottom": 56, "left": 64})
    title: str = ""
    subtitle: str = ""
    note: str = ""
    _parts: list = field(default_factory=list)

    # -- primitives ---------------------------------------------------------
    def _svg(self, body: str) -> str:
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.width}" height="{self.height}" '
            f'viewBox="0 0 {self.width} {self.height}" font-family="Helvetica, Arial, sans-serif">'
            f"{body}</svg>"
        )

    def render(self) -> str:
        self._parts.insert(0, self._header())
        return self._svg("".join(self._parts))

    def _header(self) -> str:
        parts = [f'<rect x="0" y="0" width="{self.width}" height="{self.height}" fill="#ffffff"/>']
        if self.title:
            parts.append(self._text(self.title, self.margin["left"], 30, 20, TEXT, "bold"))
        if self.subtitle:
            parts.append(self._text(self.subtitle, self.margin["left"], 50, 12, GRAY))
        if self.note:
            parts.append(
                self._text(self.note, self.margin["left"], self.height - 12, 11, GRAY, anchor="start")
            )
        return "".join(parts)

    def _text(self, s, x, y, size, fill=TEXT, weight="normal", anchor="start", opacity="1"):
        s = html.escape(str(s))
        return (
            f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" '
            f'font-weight="{weight}" text-anchor="{anchor}" opacity="{opacity}">{s}</text>'
        )

    def _rect(self, x, y, w, h, fill, rx=0, stroke="none", stroke_w=1, opacity="1"):
        return (
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{stroke_w}" opacity="{opacity}"/>'
        )

    def _line(self, x1, y1, x2, y2, color=GRID, w=1, dash=""):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="{w}"{d}/>'

    def _legend(self, items, x, y, cols=1):
        """items: list of (label, color). Draws color swatch + label row(s)."""
        out = []
        pad = 0
        cell_w = max(160, (self.width - self.margin["left"] - self.margin["right"]) / cols)
        for i, (label, color) in enumerate(items):
            cx = x + (i % cols) * cell_w
            cy = y + (i // cols) * 22
            out.append(self._rect(cx, cy - 12, 12, 12, color, rx=2))
            out.append(self._text(label, cx + 18, cy, 11.5, TEXT))
        return "".join(out)

    def _gauge(self, cx, cy, r, value, label, max_value=1.0, color=GREEN):
        """value/max_value fraction rendered as an arc gauge."""
        frac = max(0.0, min(1.0, value / max_value))
        start = 135.0
        end = 135.0 + 270.0 * frac
        out = []
        out.append(self._arc(cx, cy, r, start, 405.0, GRID, 18))
        out.append(self._arc(cx, cy, r, start, end, color, 18))
        out.append(self._text(f"{frac*100:.1f}%", cx, cy + 2, 20, TEXT, "bold", "middle"))
        out.append(self._text(label, cx, cy + 24, 11, GRAY, anchor="middle"))
        return "".join(out)

    def _arc(self, cx, cy, r, a0, a1, color, w):
        import math

        a0r, a1r = math.radians(a0 - 90), math.radians(a1 - 90)
        large = 1 if (a1 - a0) > 180 else 0
        x0, y0 = cx + r * math.cos(a0r), cy + r * math.sin(a0r)
        x1, y1 = cx + r * math.cos(a1r), cy + r * math.sin(a1r)
        d = f"M {x0:.1f} {y0:.1f} A {r} {r} 0 {large} 1 {x1:.1f} {y1:.1f}"
        return (
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" '
            f'stroke-linecap="round"/>'
        )


# ---------------------------------------------------------------------------
# chart constructors
# ---------------------------------------------------------------------------
def bar_chart(
    categories: Sequence[str],
    values: Sequence[float],
    colors: Sequence[str] | None = None,
    *,
    title: str = "",
    subtitle: str = "",
    ylabel: str = "",
    value_format: str = "{:.1f}",
    unit: str = "",
    horizontal: bool = False,
    stacked: bool = False,
    series: Sequence[Sequence[float]] | None = None,
    series_labels: Sequence[str] | None = None,
    width: int = 900,
    height: int = 480,
) -> str:
    """Bar chart. If `stacked` is set, `series` provides the segment values."""
    box = Box(width, height, title=title, subtitle=subtitle)
    m = box.margin
    plot_w = width - m["left"] - m["right"]
    plot_h = height - m["top"] - m["bottom"]

    if not stacked and not values:
        box._parts.append(box._text("No data", width / 2, height / 2, 18, GRAY, "bold", "middle"))
        return box.render()

    if stacked and series:
        n = len(series[0])
        totals = [sum(col) for col in zip(*series)]
        vmax = max(totals) * 1.08
    else:
        n = len(values)
        vmax = max(values) * 1.08 if values else 1.0

    if horizontal:
        vmax = max(values) if values else 1.0
        plot_h = max(40, len(categories) * 34)
        height = m["top"] + plot_h + m["bottom"]
        box = Box(width, height, title=title, subtitle=subtitle)
        plot_h = height - m["top"] - m["bottom"]
        bw = min(22, plot_h / len(categories) - 4)

    def y(v):
        return m["top"] + plot_h - (v / vmax) * plot_h

    def x(i):
        if horizontal:
            return m["left"]
        return m["left"] + (plot_w / n) * i

    # y gridlines + labels (vertical layout)
    if not horizontal:
        for gi in range(5):
            gv = vmax * gi / 4
            gy = y(gv)
            box._parts.append(box._line(m["left"], gy, m["left"] + plot_w, gy))
            box._parts.append(box._text(value_format.format(gv), m["left"] - 8, gy + 4, 11, GRAY, anchor="end"))
        if ylabel:
            box._parts.append(box._text(ylabel, m["left"], m["top"] - 22, 12, GRAY))

    bw = min(46, plot_w / n * 0.62) if not horizontal else bw

    legend_items = []
    baseline = m["top"] + plot_h
    if stacked and series:
        seg_colors = colors or PALETTE
        for si, row in enumerate(series):
            accum = [0.0] * n
            for ci, val in enumerate(row):
                y0 = y(accum[ci])
                y1 = y(accum[ci] + val)
                color = seg_colors[si % len(seg_colors)]
                box._parts.append(box._rect(x(ci) + (plot_w / n - bw) / 2, y1, bw, max(0.0, y0 - y1), color))
                accum[ci] += val
            legend_items.append((series_labels[si] if series_labels else f"Series {si+1}", seg_colors[si]))
        for ci, t in enumerate(totals):
            box._parts.append(
                box._text(f"{t:.0f}", x(ci) + (plot_w / n) / 2, y(t) - 6, 12, TEXT, "bold", "middle")
            )
    else:
        palette = colors or [BLUE] * n
        for i, v in enumerate(values):
            cx = x(i) + (plot_w / n) / 2
            if horizontal:
                hw = (v / vmax) * plot_w
                box._parts.append(box._rect(x(i), m["top"] + i * 34, hw, bw, palette[i % len(palette)], rx=2))
                box._parts.append(box._text(str(categories[i]), m["left"] - 8, m["top"] + i * 34 + bw / 2 + 4, 11, TEXT, anchor="end"))
                box._parts.append(box._text(f"{value_format.format(v)}{unit}", m["left"] + hw + 6, m["top"] + i * 34 + bw / 2 + 4, 11, TEXT))
            else:
                hh = max(0.0, baseline - y(v))
                box._parts.append(box._rect(cx - bw / 2, y(v), bw, hh, palette[i % len(palette)], rx=2))
                box._parts.append(box._text(str(categories[i]), cx, baseline + 20, 11, TEXT, anchor="middle"))
                box._parts.append(box._text(f"{value_format.format(v)}{unit}", cx, y(v) - 6, 12, TEXT, "bold", "middle"))

    if legend_items:
        box._parts.append(box._legend(legend_items, m["left"], m["top"] + plot_h + 34))
    return box.render()


def donut_chart(
    labels: Sequence[str],
    values: Sequence[float],
    *,
    title: str = "",
    subtitle: str = "",
    center_label: str = "Total",
    width: int = 640,
    height: int = 460,
) -> str:
    """Donut / pie chart for proportion breakdowns (e.g. resource mix)."""
    import math

    box = Box(width, height, title=title, subtitle=subtitle)
    total = sum(values) or 1.0
    cx, cy, r = 210, height // 2 + 10, 130
    a = 0.0
    for i, v in enumerate(values):
        sweep = (v / total) * 360.0
        if v <= 0:
            continue
        large = 1 if sweep > 180 else 0
        a0, a1 = a, a + sweep
        r0, r1 = math.radians(a0 - 90), math.radians(a1 - 90)
        x0, y0 = cx + r * math.cos(r0), cy + r * math.sin(r0)
        x1, y1 = cx + r * math.cos(r1), cy + r * math.sin(r1)
        xm, ym = cx + (r - 34) * math.cos((r0 + r1) / 2), cy + (r - 34) * math.sin((r0 + r1) / 2)
        color = PALETTE[i % len(PALETTE)]
        d = (
            f"M {cx} {cy} L {x0:.1f} {y0:.1f} "
            f"A {r} {r} 0 {large} 1 {x1:.1f} {y1:.1f} Z"
        )
        box._parts.append(f'<path d="{d}" fill="{color}" stroke="#ffffff" stroke-width="2"/>')
        if v / total > 0.06:
            box._parts.append(box._text(f"{v/total*100:.0f}%", xm, ym + 4, 13, "#fff", "bold", "middle"))
        a += sweep
    # center hole
    box._parts.append(box._rect(cx - 55, cy - 30, 110, 60, "#ffffff", rx=10))
    box._parts.append(box._text(center_label, cx, cy - 4, 12, GRAY, anchor="middle"))
    box._parts.append(box._text(f"{total:.0f}", cx, cy + 16, 18, TEXT, "bold", "middle"))
    # legend on the right
    lx = 360
    box._parts.append(box._legend([(f"{l} — {v}", PALETTE[i % len(PALETTE)]) for i, (l, v) in enumerate(zip(labels, values))], lx, cy - 60))
    return box.render()


def line_chart(
    series: Sequence[Sequence[float]],
    labels: Sequence[str],
    *,
    title: str = "",
    subtitle: str = "",
    xlabel: str = "",
    ylabel: str = "",
    series_names: Sequence[str] | None = None,
    width: int = 900,
    height: int = 460,
) -> str:
    """Line chart (e.g. slack vs path index, frequency sweep, power vs f)."""
    box = Box(width, height, title=title, subtitle=subtitle)
    m = box.margin
    pw, ph = width - m["left"] - m["right"], height - m["top"] - m["bottom"]
    flat = [v for s in series for v in s]
    vmin, vmax = (min(flat), max(flat)) if flat else (0, 1)
    if vmin == vmax:
        vmax += 1
    span = vmax - vmin
    vmin -= span * 0.1
    vmax += span * 0.1

    def px(i, n): return m["left"] + pw * i / max(1, n - 1)
    def py(v): return m["top"] + ph - (v - vmin) / (vmax - vmin) * ph

    for gi in range(5):
        gv = vmin + (vmax - vmin) * gi / 4
        gy = py(gv)
        box._parts.append(box._line(m["left"], gy, m["left"] + pw, gy))
        box._parts.append(box._text(f"{gv:.2f}", m["left"] - 8, gy + 4, 11, GRAY, anchor="end"))

    colors = PALETTE
    legend = []
    for si, s in enumerate(series):
        pts = " ".join(f"{px(i, len(s)):.1f},{py(v):.1f}" for i, v in enumerate(s))
        box._parts.append(f'<polyline points="{pts}" fill="none" stroke="{colors[si % len(colors)]}" stroke-width="2.5" stroke-linejoin="round"/>')
        legend.append((series_names[si] if series_names and si < len(series_names) else f"Series {si+1}", colors[si % len(colors)]))
    for i, lab in enumerate(labels):
        box._parts.append(box._text(str(lab), px(i, len(labels)), m["top"] + ph + 20, 11, TEXT, anchor="middle"))
    if xlabel:
        box._parts.append(box._text(xlabel, m["left"] + pw / 2, height - 10, 12, GRAY, anchor="middle"))
    if ylabel:
        box._parts.append(box._text(ylabel, m["left"], m["top"] - 22, 12, GRAY))
    box._parts.append(box._legend(legend, m["left"], m["top"] + ph + 36))
    return box.render()


def gauge_chart(value: float, max_value: float, label: str, *, title: str = "", color: str = GREEN, width: int = 420, height: int = 320) -> str:
    """Single-value gauge (e.g. utilization %)."""
    box = Box(width, height, title=title)
    box._parts.append(box._gauge(width // 2, height // 2 + 10, 110, value, label, max_value, color))
    return box.render()


def hbar_chart(categories, values, *, title="", subtitle="", unit="", colors=None, width=860):
    return bar_chart(categories, values, colors, title=title, subtitle=subtitle, unit=unit, horizontal=True, width=width, height=120 + len(categories) * 34)


def stacked_bar_chart(categories, series, series_labels, *, title="", subtitle="", width=900, height=460):
    return bar_chart(categories, [0] * len(categories), title=title, subtitle=subtitle, stacked=True, series=series, series_labels=series_labels, width=width, height=height)


def histogram(values: Sequence[float], *, bins: int = 10, title: str = "", subtitle: str = "", xlabel: str = "", width: int = 900, height: int = 420) -> str:
    """Histogram of a numeric series (e.g. timing slack distribution)."""
    import math

    if not values:
        return f'<svg width="{width}" height="{height}"><text x="20" y="40">no data</text></svg>'
    vmin, vmax = min(values), max(values)
    if vmin == vmax:
        vmax += 1
    lo, hi = vmin, vmax
    counts = [0] * bins
    for v in values:
        idx = min(bins - 1, int((v - lo) / (hi - lo) * bins))
        counts[idx] += 1
    return bar_chart(
        [f"{lo + (hi-lo)*i/bins:.2f}" for i in range(bins)],
        counts, title=title, subtitle=subtitle, value_format="{:.0f}", unit="",
    )
