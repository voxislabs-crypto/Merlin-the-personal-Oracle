#!/usr/bin/env python3
"""
openvoice_synthesize.py
=======================
OpenVoice v2 inference script called by openVoiceAdapter.js.

Installation (run once):
    pip install git+https://github.com/myshell-ai/MeloTTS.git
    pip install git+https://github.com/myshell-ai/OpenVoice.git

Usage:
    python3 openvoice_synthesize.py \
        --reference /path/to/reference.wav \
        --text "Hello, world." \
        --output /path/to/output.wav \
        --rate 1.0
"""

import argparse
import os
import sys
import tempfile

def main():
    parser = argparse.ArgumentParser(description="OpenVoice v2 synthesis")
    parser.add_argument("--reference", required=True, help="Path to reference WAV clip")
    parser.add_argument("--text", required=True, help="Text to synthesize")
    parser.add_argument("--output", required=True, help="Path for output WAV file")
    parser.add_argument("--rate", type=float, default=1.0, help="Speech rate (0.7–1.3)")
    parser.add_argument("--language", default="EN", help="MeloTTS language code (EN, ES, FR, ZH, JP, KR)")
    args = parser.parse_args()

    # Clamp rate to a safe range
    rate = max(0.7, min(1.3, args.rate))

    try:
        import torch
        from melo.api import TTS
        from openvoice import se_extractor
        from openvoice.api import ToneColorConverter
    except ImportError as e:
        print(
            f"[openvoice_synthesize] ImportError: {e}\n"
            "Install dependencies:\n"
            "  pip install git+https://github.com/myshell-ai/MeloTTS.git\n"
            "  pip install git+https://github.com/myshell-ai/OpenVoice.git",
            file=sys.stderr,
        )
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    # ── 1. Load tone color converter (OpenVoice v2 checkpoint) ──────────────
    # Downloads ~300 MB on first run to ~/.cache/huggingface/ or a local path.
    try:
        ckpt_converter = "checkpoints_v2/converter"
        tone_color_converter = ToneColorConverter(
            os.path.join(ckpt_converter, "config.json"), device=device
        )
        tone_color_converter.load_ckpt(os.path.join(ckpt_converter, "checkpoint.pth"))
    except Exception as e:
        # Fall back to HuggingFace auto-download path
        try:
            from huggingface_hub import snapshot_download
            ckpt_root = snapshot_download(repo_id="myshell-ai/OpenVoice", cache_dir=None)
            ckpt_converter = os.path.join(ckpt_root, "checkpoints_v2", "converter")
            tone_color_converter = ToneColorConverter(
                os.path.join(ckpt_converter, "config.json"), device=device
            )
            tone_color_converter.load_ckpt(os.path.join(ckpt_converter, "checkpoint.pth"))
        except Exception as e2:
            print(f"[openvoice_synthesize] Failed to load tone color converter: {e2}", file=sys.stderr)
            sys.exit(1)

    # ── 2. Extract speaker embedding from reference clip ────────────────────
    try:
        target_se, _ = se_extractor.get_se(
            args.reference,
            tone_color_converter,
            vad=True,
        )
    except Exception as e:
        print(f"[openvoice_synthesize] Failed to extract speaker embedding: {e}", file=sys.stderr)
        sys.exit(1)

    # ── 3. Synthesize base audio with MeloTTS ───────────────────────────────
    try:
        tts_model = TTS(language=args.language, device=device)
        speaker_ids = tts_model.hps.data.spk2id
        speaker_key = args.language.lower()
        speaker_id = speaker_ids.get(
            speaker_key,
            list(speaker_ids.values())[0],
        )
    except Exception as e:
        print(f"[openvoice_synthesize] Failed to load MeloTTS: {e}", file=sys.stderr)
        sys.exit(1)

    # Write base synthesis to a temp file, then convert tone color
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_base = tmp.name

    try:
        tts_model.tts_to_file(
            args.text,
            speaker_id,
            tmp_base,
            speed=rate,
        )

        # ── 4. Apply tone color conversion ──────────────────────────────────
        # Get the base speaker embedding
        source_se = torch.load(
            os.path.join(
                os.path.dirname(ckpt_converter),
                "base_speakers",
                "ses",
                f"{speaker_key}.pth",
            ),
            map_location=device,
        )

        tone_color_converter.convert(
            audio_src_path=tmp_base,
            src_se=source_se,
            tgt_se=target_se,
            output_path=args.output,
            message="@MyShell",
        )

    except Exception as e:
        print(f"[openvoice_synthesize] Synthesis or conversion failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if os.path.exists(tmp_base):
            os.unlink(tmp_base)

    print(f"[openvoice_synthesize] Written to {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
