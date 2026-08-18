"""Skyvern 共通設定。

Skyvern Cloud は使わない。ローカル Chromium + 既存 Bedrock 推論プロファイルのみ。

環境変数:
  AWS_REGION
  AWS_BEDROCK_MODEL_ARN_ID  Bedrock 推論プロファイル ARN
  AWS_PROFILE               省略可。未設定のキーがある場合は boto3 の標準チェーン
  SKYVERN_HEADLESS          "1" / "true" ならヘッドレス
  RECORD_VIDEO_DIR          設定時、実行内容を .mp4 として保存する（PR 用デモ撮影向け）
"""

from __future__ import annotations

import os
import subprocess
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from skyvern import Skyvern
from skyvern.config import settings as skyvern_settings
from skyvern.library.skyvern_browser import SkyvernBrowser
from skyvern.library.skyvern_browser_page import SkyvernBrowserPage
from skyvern.schemas.llm import LLMConfig

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

VIEWPORT = {"width": 1280, "height": 800}
CDP_PORT = 9223


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"環境変数 {name} が設定されていません")
    return value


def allow_localhost() -> None:
    """page.goto の SSRF 検査は embedded server 初期化より先に走る。"""
    skyvern_settings.ALLOWED_HOSTS = ["localhost", "127.0.0.1"]
    skyvern_settings.BLOCKED_HOSTS = []


def _headless() -> bool:
    return os.environ.get("SKYVERN_HEADLESS", "").lower() in ("1", "true", "yes")


def _webm_to_mp4(webm: Path) -> Path:
    mp4 = webm.parent / "todo.mp4"
    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(webm),
            "-an",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            str(mp4),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg で mp4 変換に失敗しました:\n{result.stderr}")
    webm.unlink(missing_ok=True)
    return mp4


def create_skyvern() -> Skyvern:
    region = require_env("AWS_REGION")
    model_arn = require_env("AWS_BEDROCK_MODEL_ARN_ID")
    allow_localhost()
    return Skyvern.local(
        use_in_memory_db=True,
        llm_config=LLMConfig(
            model_name=f"bedrock/{model_arn}",
            required_env_vars=["AWS_REGION"],
            supports_vision=True,
            add_assistant_prefix=False,
            max_completion_tokens=64000,
            temperature=1,
        ),
        settings={
            "ENABLE_BEDROCK": True,
            "AWS_REGION": region,
            "MAX_STEPS_PER_RUN": 8,
            "BROWSER_TYPE": "chromium-headless" if _headless() else "chromium-headful",
            "ALLOWED_HOSTS": ["localhost", "127.0.0.1"],
            "BLOCKED_HOSTS": [],
        },
    )


@asynccontextmanager
async def session() -> AsyncIterator[tuple[Skyvern, SkyvernBrowser, SkyvernBrowserPage]]:
    client = create_skyvern()
    video_dir = os.environ.get("RECORD_VIDEO_DIR")
    playwright = None
    launched = None
    video_context = None
    recorded_videos: list[Any] = []
    browser: SkyvernBrowser | None = None
    try:
        if video_dir:
            from playwright.async_api import async_playwright

            Path(video_dir).mkdir(parents=True, exist_ok=True)
            playwright = await async_playwright().start()
            launched = await playwright.chromium.launch(
                headless=_headless(),
                args=[
                    f"--window-size={VIEWPORT['width']},{VIEWPORT['height']}",
                    f"--remote-debugging-port={CDP_PORT}",
                ],
            )
            video_context = await launched.new_context(
                viewport=VIEWPORT,
                record_video_dir=video_dir,
                record_video_size={
                    "width": VIEWPORT["width"],
                    "height": VIEWPORT["height"],
                },
            )
            await video_context.new_page()
            browser = await client.connect_to_browser_over_cdp(f"http://127.0.0.1:{CDP_PORT}")
        else:
            browser = await client.launch_local_browser(
                headless=_headless(),
                args=[f"--window-size={VIEWPORT['width']},{VIEWPORT['height']}"],
            )
        page = await browser.get_working_page()
        await page.page.set_viewport_size(VIEWPORT)
        if video_context is not None:
            recorded_videos = [p.video for p in video_context.pages if p.video]
        yield client, browser, page
    finally:
        if video_context is not None:
            if not recorded_videos:
                recorded_videos = [p.video for p in video_context.pages if p.video]
            await video_context.close()
            webms = [Path(await video.path()) for video in recorded_videos]
            if webms:
                webm = max(webms, key=lambda path: path.stat().st_size if path.exists() else 0)
                mp4 = _webm_to_mp4(webm)
                for leftover in webms:
                    leftover.unlink(missing_ok=True)
                print(f"  🎥 {mp4}")
        if browser is not None:
            await browser.close()
        if launched is not None:
            await launched.close()
        if playwright is not None:
            await playwright.stop()
        await client.aclose()


async def act(page: SkyvernBrowserPage, instruction: str) -> None:
    await page.act(instruction)


async def get_task_id_by_title(page: SkyvernBrowserPage, title: str) -> str:
    items = page.locator('[data-testid^="task-item-"]')
    count = await items.count()
    for i in range(count):
        item = items.nth(i)
        test_id = await item.get_attribute("data-testid") or ""
        task_id = test_id.removeprefix("task-item-")
        text = (await item.locator(f'[data-testid="task-title-{task_id}"]').text_content() or "").strip()
        if text == title:
            return task_id
    return ""


def log(step: str, message: str) -> None:
    print(f"\n📌 [{step}] {message}")


def ok(message: str) -> None:
    print(f"  ✅ {message}")


def fail(message: str) -> None:
    raise RuntimeError(f"❌ {message}")


def run(main: Any) -> None:
    import asyncio

    try:
        asyncio.run(main())
    except RuntimeError as error:
        print(f"\n{error}", file=sys.stderr)
        sys.exit(1)
