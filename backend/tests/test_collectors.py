"""Collector helpers: HTML -> text cleaner used to store source-provided bodies.

clean_html_to_text is a pure function (no IO). It must strip tags / scripts /
styles, preserve paragraph structure, unescape entities, and cap length.
"""

from __future__ import annotations

from app.collectors.base import (
    CONTENT_MAX_CHARS,
    clean_html_to_text,
)


def test_clean_html_empty_returns_none():
    assert clean_html_to_text(None) is None
    assert clean_html_to_text("") is None
    assert clean_html_to_text("   \n  ") is None


def test_clean_html_strips_tags_keeps_text():
    out = clean_html_to_text("<p>Hello <b>world</b></p>")
    assert out is not None
    assert "Hello" in out and "world" in out
    assert "<" not in out and ">" not in out


def test_clean_html_drops_script_and_style():
    raw = (
        "<div><script>var x = 1;</script>"
        "<style>.a{color:red}</style>"
        "<p>Real content here</p></div>"
    )
    out = clean_html_to_text(raw)
    assert out is not None
    assert "Real content here" in out
    assert "var x" not in out
    assert "color:red" not in out


def test_clean_html_unescapes_entities():
    out = clean_html_to_text("<p>AT&amp;T &lt;tag&gt; &quot;q&quot;</p>")
    assert out is not None
    assert "AT&T" in out
    assert "<tag>" in out
    assert '"q"' in out


def test_clean_html_preserves_paragraph_breaks():
    out = clean_html_to_text("<p>First para.</p><p>Second para.</p>")
    assert out is not None
    assert "First para." in out
    assert "Second para." in out
    # paragraphs separated by a blank line (not glued together)
    assert "\n" in out


def test_clean_html_collapses_excess_blank_lines():
    out = clean_html_to_text("<p>A</p><br><br><br><br><p>B</p>")
    assert out is not None
    assert "\n\n\n" not in out  # never more than one blank line between blocks


def test_clean_html_truncates_long_content():
    long_html = "<p>" + ("word " * 10000) + "</p>"  # well over the cap
    out = clean_html_to_text(long_html)
    assert out is not None
    assert len(out) <= CONTENT_MAX_CHARS + 20  # cap + marker
    assert out.endswith("[内容已截断]")


def test_clean_html_respects_custom_max():
    out = clean_html_to_text("<p>abcdefghij klmnop</p>", max_chars=5)
    assert out is not None
    assert out.startswith("abcde")
    assert out.endswith("[内容已截断]")


def test_clean_html_plain_text_passthrough():
    # arXiv abstract is plain text (no tags); it should survive intact.
    out = clean_html_to_text("This is a plain abstract about transformers.")
    assert out == "This is a plain abstract about transformers."
