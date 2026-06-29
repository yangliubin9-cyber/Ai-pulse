"""Post-translation typesetting clean-up for mixed CJK / Latin text.

The offline MT engine emits Chinese with English / digit tokens (model names,
acronyms, glossary placeholders restored to ASCII) embedded in it. The raw output
has inconsistent spacing: stray spaces before CJK punctuation, missing spaces
between Chinese and Latin runs, spurious spaces between two Chinese runs, doubled
spaces, ragged blank lines.

``tidy_cjk`` normalises *only whitespace* so the rendered Chinese reads cleanly.
It never substitutes one punctuation mark for another and never touches the
characters themselves -- it is a pure, side-effect-free typographer.

``normalize_cjk_punct`` is the complementary pass that *does* substitute marks:
it converts ASCII punctuation (``, . : ; ! ? ( )``) to its full-width CJK form
(``，。：；！？（）``) but **only** where the mark sits in Chinese context (a CJK
character is its nearest non-space neighbour on either side). It guards digits
(``3,593`` / ``10.3`` / ``12:00`` / ``3:1``) and URLs / emails so numeric and web
tokens are never touched. The two passes are chained (normalize first, then
tidy) so the stored Chinese ends up with full-width punctuation *and* clean
spacing.

Rules applied:

1. Remove spaces sitting next to a CJK / fullwidth punctuation mark
   (``说 "AI"`` keeps its inner spacing handled by rule 3, ``转折 。`` -> ``转折。``).
2. Remove spaces *between two CJK ideographs* (MT sometimes splits a Chinese run:
   ``领先 开放`` -> ``领先开放``).
3. Ensure exactly one half-width space between a CJK ideograph and an adjacent
   Latin letter / digit (``GLM-5.2是`` -> ``GLM-5.2 是``, ``使用 PyTorch 训练``
   keeps its single spaces).
4. Collapse runs of spaces/tabs to one, strip per-line trailing / leading spaces,
   and cap blank runs at a single empty line between paragraphs.

All functions are pure (no IO) and fully unit-tested.
"""

from __future__ import annotations

import re

# CJK ideograph + Japanese/Korean ranges we treat as "han" characters: a single
# space against ASCII punctuation is wrong, and adjacent Latin needs exactly one
# space. Mirrors the detection ranges used by is_probably_chinese.
_HAN = (
    r"一-鿿"   # CJK Unified Ideographs
    r"㐀-䶿"   # CJK Extension A
    r"豈-﫿"   # CJK Compatibility Ideographs
    r"぀-ヿ"   # Hiragana + Katakana
    r"가-힯"   # Hangul syllables
)
# CJK symbols/punctuation (3000-303F) + fullwidth forms (FF00-FFEF). A space must
# never be pressed up against these.
_CJK_PUNCT = r"　-〿＀-￯"

# --- compiled patterns ------------------------------------------------------

# 1. space(s) hugging a CJK / fullwidth punctuation mark -> drop (both sides).
_SPACE_BEFORE_PUNCT = re.compile(rf"[ \t]+(?=[{_CJK_PUNCT}])")
_SPACE_AFTER_PUNCT = re.compile(rf"(?<=[{_CJK_PUNCT}])[ \t]+")

# 2. space(s) between two han ideographs -> drop (MT split a Chinese run).
_SPACE_BETWEEN_HAN = re.compile(rf"(?<=[{_HAN}])[ \t]+(?=[{_HAN}])")

# 3. space between a han char and an ASCII quote/bracket -> drop, so quoted
#    inline terms hug the surrounding Chinese (``说 "AI" 是`` -> ``说"AI"是``).
_ASCII_EDGE = r"\"'(){}\[\]<>"
_SPACE_HAN_THEN_EDGE = re.compile(rf"(?<=[{_HAN}])[ \t]+(?=[{_ASCII_EDGE}])")
_SPACE_EDGE_THEN_HAN = re.compile(rf"(?<=[{_ASCII_EDGE}])[ \t]+(?=[{_HAN}])")

# 4. han ideograph adjacent to Latin/digit with NO space -> insert one.
_HAN_THEN_LATIN = re.compile(rf"(?<=[{_HAN}])(?=[A-Za-z0-9])")
_LATIN_THEN_HAN = re.compile(rf"(?<=[A-Za-z0-9])(?=[{_HAN}])")

# 4. whitespace tidy.
_MULTISPACE = re.compile(r"[ \t]{2,}")
_TRAILING_WS = re.compile(r"[ \t]+(?=\n)")
_LEADING_WS = re.compile(r"(?<=\n)[ \t]+")
_MULTI_BLANK = re.compile(r"\n{3,}")


def tidy_cjk(text: str | None) -> str | None:
    """Normalise spacing in mixed CJK / Latin translated text.

    Pure function. Returns the input unchanged for falsy / non-str input. Only
    whitespace is altered; characters and punctuation are preserved verbatim.
    """
    if not text:
        return text

    # 1. Strip spaces around CJK / fullwidth punctuation.
    text = _SPACE_BEFORE_PUNCT.sub("", text)
    text = _SPACE_AFTER_PUNCT.sub("", text)

    # 2. Strip spurious spaces between two Chinese characters.
    text = _SPACE_BETWEEN_HAN.sub("", text)

    # 3. Strip spaces between a han char and an ASCII quote/bracket.
    text = _SPACE_HAN_THEN_EDGE.sub("", text)
    text = _SPACE_EDGE_THEN_HAN.sub("", text)

    # 4. Insert the missing single space at CJK<->Latin boundaries (existing
    #    single spaces already satisfy the lookahead/behind, so none are added).
    text = _HAN_THEN_LATIN.sub(" ", text)
    text = _LATIN_THEN_HAN.sub(" ", text)

    # 5. Collapse leftover ASCII space runs, trim line edges, cap blank lines.
    text = _MULTISPACE.sub(" ", text)
    text = _TRAILING_WS.sub("", text)
    text = _LEADING_WS.sub("", text)
    text = _MULTI_BLANK.sub("\n\n", text)
    return text.strip()


# --- full-width punctuation normalisation -----------------------------------

# Half-width ASCII punctuation -> its full-width CJK counterpart. Only these
# eight marks are converted; hyphen / quote / slash / asterisk are deliberately
# left alone.
_HALF_TO_FULL = {
    ",": "，",
    ".": "。",
    ":": "：",
    ";": "；",
    "!": "！",
    "?": "？",
    "(": "（",
    ")": "）",
}

# A character counts as "CJK context" if it is a han ideograph or an already
# full-width / CJK punctuation mark. Used to decide whether an ASCII mark is
# adjacent to Chinese.
_IS_CJK_CTX = re.compile(rf"[{_HAN}{_CJK_PUNCT}]")

# ASCII digit either side (for the . , : numeric guard).
_DIGIT = "0-9"


def _is_url_token(text: str, pos: int) -> bool:
    """Return True if the whitespace-delimited token containing index ``pos`` is a
    URL / email (so its inner ``. : /`` must not be converted).

    A token qualifies if it contains ``://`` or ``@`` or starts with ``http`` or
    ``www.`` — covering ``https://...``, ``user@host``, bare ``www.example.com``.
    """
    start = pos
    while start > 0 and not text[start - 1].isspace():
        start -= 1
    end = pos
    n = len(text)
    while end < n and not text[end].isspace():
        end += 1
    token = text[start:end]
    low = token.lower()
    return "://" in token or "@" in token or low.startswith("http") or low.startswith("www.")


def normalize_cjk_punct(text: str | None) -> str | None:
    """Convert half-width ASCII punctuation to full-width **in Chinese context**.

    Pure function. Returns the input unchanged for falsy / non-str input. Scans
    each candidate mark (``, . : ; ! ? ( )``) and converts it to its full-width
    form *only when* a CJK character is its nearest non-space neighbour on either
    side, subject to these guards (left untouched otherwise):

    * **Digit guard** — ``.`` / ``,`` / ``:`` flanked by digits on *both* sides
      stay half-width (``3,593`` / ``10.3`` / ``v1.0`` / ``12:00`` / ``3:1``).
    * **URL / email guard** — a mark whose whitespace-delimited token is a URL or
      email (contains ``://`` / ``@``, or starts with ``http`` / ``www.``) stays
      half-width, so ``https://arxiv.org/abs/2606.23689v1`` is preserved verbatim.
    * Brackets ``(`` ``)`` convert only when adjacent to CJK; a purely English /
      code context (CJK on neither side) is left as ASCII.

    Whitespace clean-up (no space between Chinese and the new full-width mark) is
    handled by chaining :func:`tidy_cjk` afterwards.

    The single pass below decides each mark's fate from the *original* string, so
    a run like ``。..`` only converts the dot whose neighbour is already CJK on
    that pass. To stay idempotent (re-running yields no further change) we iterate
    to a fixed point: each pass only ever turns ASCII into full-width (monotonic)
    and is bounded by the string length, so it converges in a few iterations.
    """
    if not text:
        return text
    prev = text
    while True:
        nxt = _normalize_pass(prev)
        if nxt == prev:
            return nxt
        prev = nxt


def _normalize_pass(text: str) -> str:
    """One left-to-right conversion pass (see :func:`normalize_cjk_punct`)."""
    out: list[str] = []
    n = len(text)
    for i, ch in enumerate(text):
        full = _HALF_TO_FULL.get(ch)
        if full is None:
            out.append(ch)
            continue

        # Nearest non-space neighbours either side (skip spaces/tabs, not newlines
        # which end the visual line — a mark at line end still gets its CJK left
        # neighbour, which is what we want).
        prev_ch = ""
        j = i - 1
        while j >= 0 and text[j] in " \t":
            j -= 1
        if j >= 0:
            prev_ch = text[j]
        next_ch = ""
        k = i + 1
        while k < n and text[k] in " \t":
            k += 1
        if k < n:
            next_ch = text[k]

        prev_cjk = bool(prev_ch) and bool(_IS_CJK_CTX.match(prev_ch))
        next_cjk = bool(next_ch) and bool(_IS_CJK_CTX.match(next_ch))
        if not (prev_cjk or next_cjk):
            out.append(ch)  # no Chinese context -> leave ASCII
            continue

        # Digit guard for . , : -- both immediate neighbours are ASCII digits.
        if ch in ".,:":
            prev_imm = text[i - 1] if i > 0 else ""
            next_imm = text[i + 1] if i + 1 < n else ""
            if prev_imm.isdigit() and next_imm.isdigit():
                out.append(ch)
                continue

        # URL / email guard for . : ( the slash never appears here ).
        if ch in ".:" and _is_url_token(text, i):
            out.append(ch)
            continue

        out.append(full)

    return "".join(out)
