"""Unit tests for the pure split_reason() function."""

from __future__ import annotations

from app.split_reason import split_reason


def test_split_basic_fullwidth_colon():
    body, reason = split_reason("摘要正文内容。\n\n推荐理由：这条值得一看。")
    assert body == "摘要正文内容。"
    assert reason == "这条值得一看。"


def test_split_halfwidth_colon():
    body, reason = split_reason("摘要正文。\n\n推荐理由:半角冒号也兼容。")
    assert body == "摘要正文。"
    assert reason == "半角冒号也兼容。"


def test_no_marker_returns_body_unchanged_reason_none():
    text = "纯摘要正文，没有推荐理由这个标记词的冒号形式。"
    body, reason = split_reason(text)
    assert body == text
    assert reason is None


def test_reason_with_markdown_bold_is_preserved():
    body, reason = split_reason("正文。\n\n推荐理由：**重点**在于它很关键。")
    assert body == "正文。"
    assert reason == "**重点**在于它很关键。"


def test_none_input():
    assert split_reason(None) == (None, None)


def test_empty_input():
    assert split_reason("") == ("", None)


def test_body_trailing_blank_lines_stripped():
    body, reason = split_reason("正文行1\n正文行2\n\n\n推荐理由：理由文本")
    assert body == "正文行1\n正文行2"
    assert reason == "理由文本"


def test_reason_surrounding_whitespace_stripped():
    body, reason = split_reason("正文。\n\n推荐理由：   有空白包裹的理由   ")
    assert reason == "有空白包裹的理由"


def test_first_marker_wins_fullwidth_preferred():
    # Both markers present; the full-width one appears first and is used.
    body, reason = split_reason("正文。\n推荐理由：理由含一个半角 推荐理由: 在里面")
    assert body == "正文。"
    assert reason == "理由含一个半角 推荐理由: 在里面"
