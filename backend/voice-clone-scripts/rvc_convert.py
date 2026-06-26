#!/usr/bin/env python3
"""
rvc_convert.py
==============
RVC voice conversion script called by rvcAdapter.js.
Converts a WAV file using a pre-trained RVC model (.pth).

Installation (run once):
    pip install rvc-python

Usage:
    python3 rvc_convert.py \
        --model /path/to/model.pth \
        --input /path/to/input.wav \
        --output /path/to/output.wav \
        --f0-method rmvpe \
        --pitch 0 \
        [--index /path/to/model.index]
"""

import argparse
import sys
import os


def main():
    parser = argparse.ArgumentParser(description="RVC voice conversion")
    parser.add_argument("--model", required=True, help="Path to RVC .pth model file")
    parser.add_argument("--input", required=True, help="Path to input WAV file")
    parser.add_argument("--output", required=True, help="Path for output WAV file")
    parser.add_argument(
        "--f0-method",
        default="rmvpe",
        choices=["rmvpe", "pm", "harvest", "crepe"],
        help="Pitch extraction method (rmvpe recommended for CPU)",
    )
    parser.add_argument(
        "--pitch",
        type=int,
        default=0,
        help="Pitch shift in semitones (-24 to +24)",
    )
    parser.add_argument("--index", default="", help="Optional path to .index file")
    parser.add_argument(
        "--index-rate",
        type=float,
        default=0.5,
        help="Index influence (0.0–1.0)",
    )
    parser.add_argument(
        "--protect",
        type=float,
        default=0.33,
        help="Protect voiceless consonants (0.0–0.5)",
    )
    args = parser.parse_args()

    # Clamp pitch shift
    pitch = max(-24, min(24, int(args.pitch)))

    try:
        from rvc_python.infer import RVCInference
    except ImportError:
        print(
            "[rvc_convert] ImportError: rvc-python is not installed.\n"
            "Install it with:  pip install rvc-python",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        rvc = RVCInference(device="cpu")  # set device="cuda:0" for GPU
        rvc.load_model(args.model)

        rvc.infer(
            input_path=args.input,
            output_path=args.output,
            f0_method=args.f0_method,
            f0_up_key=pitch,
            index_path=args.index if args.index else "",
            index_rate=args.index_rate,
            protect=args.protect,
            filter_radius=3,
            resample_sr=0,
            rms_mix_rate=0.25,
        )

    except Exception as e:
        print(f"[rvc_convert] Inference failed: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"[rvc_convert] Written to {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
