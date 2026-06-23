"""Post-translation typesetting clean-up for mixed CJK / Latin text.

The offline MT engine emits Chinese with English / digit tokens (model names,
acronyms, glossary placeholders restored to ASCII) embedded in it. The raw output
has inconsistent spacing: stray spaces before CJK punctuation, missing spaces
between Chinese and Latin runs, spurious spaces between two Chinese runs, doubled
spaces, ragged blank lines.

``tidy_cjk`` normalises *only whitespace* so the rendered Chinese reads cleanly.
It never substitutes one punctuation mark for another and never touches the
characters themselves -- it is a pure, side-effect-free typographer.

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
