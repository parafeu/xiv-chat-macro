#!/usr/bin/env python3
"""Extract glyph advance widths from FF14's AXIS_*.fdt file.

Reads the sqpack archive from the local game install, locates the FDT file by
hashing its virtual path, decompresses the dat blocks, parses the FDT binary,
and writes a JSON file mapping { "codepoint": advance_width_px } so the alert
box generator can compute pixel-accurate padding that matches what the game
will render.

Requires a legit local FF14 install. Outputs to
app/constants/ff14FontWidths.json (which is gitignored).

Usage:
  python3 scripts/extract-font-widths.py
  python3 scripts/extract-font-widths.py --font AXIS_14
  python3 scripts/extract-font-widths.py --sqpack /path/to/ffxiv/sqpack/ffxiv
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
import zlib
from pathlib import Path


# ---- sqpack lookup ------------------------------------------------------

def path_hash(path: str) -> int:
    """SqPack path hash: bitwise-NOT of the CRC32 of the lowercased path."""
    return (~zlib.crc32(path.lower().encode("ascii"))) & 0xFFFFFFFF


def read_index2_entries(index_path: Path) -> dict[int, int]:
    """Read *.index2 file and return { full_path_hash: packed_entry }.

    SqPack files start with a 1024-byte SqPack header. Immediately after is the
    Index header (also 1024 bytes) whose +0x08 / +0x0C fields point at the
    index data segment. Each entry in index2 is 8 bytes: uint32 full_path_hash
    + uint32 packed_entry (see resolve_entry).
    """
    with index_path.open("rb") as f:
        # SqPack header ends at 0x400. Index header starts there; +0x08 is the
        # offset of the index data segment, +0x0C is its size.
        f.seek(0x400 + 0x08)
        data_offset = struct.unpack("<I", f.read(4))[0]
        data_size   = struct.unpack("<I", f.read(4))[0]
        f.seek(data_offset)
        data = f.read(data_size)

    entries: dict[int, int] = {}
    for i in range(0, len(data), 8):
        full_hash, entry = struct.unpack_from("<II", data, i)
        entries[full_hash] = entry
    return entries


def resolve_entry(entry: int) -> tuple[int, int]:
    """Unpack an index entry into (dat_file_id, offset_in_dat)."""
    dat_id = (entry & 0xF) >> 1
    offset = (entry & ~0xF) * 8
    return dat_id, offset


# ---- dat block reader ---------------------------------------------------

def read_file_from_dat(dat_path: Path, offset: int) -> bytes:
    """Read a file from a *.dat archive at `offset`, decompressing blocks."""
    with dat_path.open("rb") as f:
        f.seek(offset)
        header_size = struct.unpack("<I", f.read(4))[0]
        f.seek(offset)
        header = f.read(header_size)

        # FileInfo header:
        #   0x00 uint32 header_size
        #   0x04 uint32 type          (2 = binary/standard)
        #   0x08 uint32 raw_file_size
        #   0x0C uint32 (unknown)
        #   0x10 uint32 (unknown)
        #   0x14 uint32 block_count
        raw_file_size = struct.unpack_from("<I", header, 0x08)[0]
        block_count = struct.unpack_from("<I", header, 0x14)[0]

        # Block table starts at 0x18; each entry is 8 bytes:
        #   uint32 offset_in_file
        #   uint16 compressed_length
        #   uint16 uncompressed_length
        out = bytearray()
        for i in range(block_count):
            block_entry_off = 0x18 + i * 8
            block_offset, comp_len, uncomp_len = struct.unpack_from(
                "<IHH", header, block_entry_off
            )
            f.seek(offset + header_size + block_offset)

            # Block: 16-byte header then data.
            #   uint32 header_size (= 16)
            #   uint32 (unknown)
            #   uint32 compressed_length  (0x7D00 = 32000 = uncompressed marker)
            #   uint32 uncompressed_length
            block_header = f.read(16)
            _, _, comp_len_2, uncomp_len_2 = struct.unpack("<IIII", block_header)
            if comp_len_2 == 32000:
                # Block is stored uncompressed.
                out += f.read(uncomp_len_2)
            else:
                raw = f.read(comp_len_2)
                out += zlib.decompress(raw, -zlib.MAX_WBITS)

        # Truncate to expected raw size (padding blocks might overshoot).
        return bytes(out[:raw_file_size])


# ---- FDT parser ---------------------------------------------------

def parse_fdt(buf: bytes) -> tuple[dict, list[dict]]:
    """Parse an FDT file. Returns (fontHeader, [glyphs])."""
    if buf[:4] != b"fcsv":
        raise RuntimeError(f"Not an FDT file (sig: {buf[:4]!r})")

    # FdtHeader layout (confirmed by inspecting AXIS_*.fdt bytes):
    #   0x00  char    signature[4]       "fcsv"
    #   0x04  char    version[4]         "0100"
    #   0x08  uint32  fthdOffset          (usually 0x20)
    #   0x0C  uint32  fileSize
    #   0x10-0x1F    padding to 32 bytes
    fthd_offset = struct.unpack_from("<I", buf, 0x08)[0]

    # FThd (font header):
    #   char signature[4] = "fthd"
    #   uint32 glyphCount
    #   uint32 kerningCount
    #   uint32 padding
    #   uint16 textureWidth    (0x0400 = 1024)
    #   uint16 textureHeight   (0x0400 = 1024)
    #   float  size            (12.0, 14.0, 18.0, 36.0)
    #   uint32 lineHeight
    #   uint32 ascent
    assert buf[fthd_offset:fthd_offset + 4] == b"fthd"
    glyph_count   = struct.unpack_from("<I", buf, fthd_offset + 4)[0]
    kerning_count = struct.unpack_from("<I", buf, fthd_offset + 8)[0]
    metrics = {
        "textureWidth":  struct.unpack_from("<H", buf, fthd_offset + 0x10)[0],
        "textureHeight": struct.unpack_from("<H", buf, fthd_offset + 0x12)[0],
        "size":          struct.unpack_from("<f", buf, fthd_offset + 0x14)[0],
        "lineHeight":    struct.unpack_from("<I", buf, fthd_offset + 0x18)[0],
        "ascent":        struct.unpack_from("<I", buf, fthd_offset + 0x1C)[0],
        "glyphCount":    glyph_count,
        "kerningCount":  kerning_count,
    }

    # Glyph table starts right after the FTHD header (32 bytes).
    #
    # FontGlyph layout per-entry (16 bytes, observed in AXIS_*):
    #   0x00  uint32  charCode        (UTF-8-like encoded codepoint)
    #   0x04  uint16  charCodeAlt
    #   0x06  uint16  textureMeta      (channel / sheet bits)
    #   0x08  uint16  textureOffsetX
    #   0x0A  uint16  textureOffsetY
    #   0x0C  uint8   width            (glyph bitmap width in px)
    #   0x0D  uint8   height
    #   0x0E  int8    xOffset          (left-side bearing; signed)
    #   0x0F  int8    yOffset
    glyphs_start = fthd_offset + 32
    glyphs: list[dict] = []
    for i in range(glyph_count):
        off = glyphs_start + i * 16
        charcode_raw = struct.unpack_from("<I", buf, off + 0x00)[0]
        width        = buf[off + 0x0C]
        height       = buf[off + 0x0D]
        x_offset     = struct.unpack_from("<b", buf, off + 0x0E)[0]
        glyphs.append({
            "char_raw": charcode_raw,
            "width":    width,
            "height":   height,
            "x_offset": x_offset,
        })

    return metrics, glyphs


def decode_game_codepoint(raw: int) -> int | None:
    """The charCode field in FDT is a UTF-8 style encoding. Split into bytes
    (big-endian), strip trailing nulls, and utf-8 decode to a single char."""
    bs = raw.to_bytes(4, "big").lstrip(b"\0")
    if not bs:
        return None
    try:
        s = bs.decode("utf-8")
    except UnicodeDecodeError:
        return None
    if len(s) != 1:
        return None
    return ord(s)


# ---- main --------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--sqpack", type=Path,
                    default=Path("~/.xlcore/ffxiv/game/sqpack/ffxiv").expanduser())
    ap.add_argument("--font", default="AXIS_12")
    ap.add_argument("--out",  type=Path,
                    default=Path(__file__).resolve().parent.parent / "app/constants/ff14FontWidths.json")
    args = ap.parse_args()

    sqpack = args.sqpack
    index2 = sqpack / "000000.win32.index2"
    target = f"common/font/{args.font}.fdt"

    if not index2.is_file():
        print(f"index2 not found: {index2}", file=sys.stderr)
        return 1

    h = path_hash(target)
    print(f"Looking up {target}  (hash=0x{h:08x})")
    entries = read_index2_entries(index2)
    print(f"  index2 contains {len(entries)} entries")
    if h not in entries:
        print(f"  NOT FOUND in index2.", file=sys.stderr)
        return 2

    dat_id, offset = resolve_entry(entries[h])
    dat_path = sqpack / f"000000.win32.dat{dat_id}"
    print(f"  dat{dat_id} @ 0x{offset:x}  ({dat_path.name})")

    raw = read_file_from_dat(dat_path, offset)
    print(f"  extracted {len(raw)} bytes")

    metrics, glyphs = parse_fdt(raw)
    print(f"  metrics: {metrics}")

    widths: dict[str, int] = {}
    for g in glyphs:
        cp = decode_game_codepoint(g["char_raw"])
        if cp is None:
            continue
        # advance = visible width + left bearing (xOffset, signed). FF14's
        # box-drawing glyphs use width/xOffset pairs that all sum to the
        # same cell size — that's how `━┏┓` align with `┃ x ┃` in-game.
        widths[str(cp)] = g["width"] + g["x_offset"]

    payload = {
        "font": args.font,
        "size": metrics["size"],
        "lineHeight": metrics["lineHeight"],
        "ascent": metrics["ascent"],
        "widths": widths,  # codepoint (as str) → advance width in px
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    print(f"  wrote {len(widths)} glyph widths → {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
