"""Shrinks the bundled Chinese fonts to the characters in assets/fonts/subset-characters.txt.

Run on a developer machine (needs `pip install fonttools`), after build-font-character-list:

    python scripts/subset-fonts.py <directory containing the full font files>

See docs/THIRD_PARTY.md for where to download each font and its license.
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS_DIRECTORY = ROOT / "assets" / "fonts"
CHARACTER_LIST = FONTS_DIRECTORY / "subset-characters.txt"

# Full font file name -> subset file name used by src/services/fontRotation.ts
FONTS_TO_SUBSET = {
    "NotoSerifTC-Regular.otf": "NotoSerifTC-subset.otf",
    "LXGWWenKaiTC-Regular.ttf": "LXGWWenKaiTC-subset.ttf",
    "jf-openhuninn.ttf": "OpenHuninn-subset.ttf",
}


def subset_font(source: Path, destination: Path) -> None:
    subprocess.run(
        [
            sys.executable, "-m", "fontTools.subset", str(source),
            f"--text-file={CHARACTER_LIST}",
            f"--output-file={destination}",
            "--layout-features=*",
            "--no-hinting",
            "--desubroutinize",
        ],
        check=True,
    )
    size_in_megabytes = destination.stat().st_size / (1024 * 1024)
    print(f"{destination.name}: {size_in_megabytes:.1f} MB")


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source_directory = Path(sys.argv[1])
    for source_name, subset_name in FONTS_TO_SUBSET.items():
        subset_font(source_directory / source_name, FONTS_DIRECTORY / subset_name)


if __name__ == "__main__":
    main()
