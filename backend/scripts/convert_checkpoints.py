"""Ubah y_mu / y_sd di checkpoint dari array numpy menjadi list Python biasa, supaya
bisa dimuat dengan torch.load(weights_only=True) di backend.

Jalankan dari folder backend/ (venv aktif):
    python scripts/convert_checkpoints.py [folder_asal] [folder_tujuan]
Bawaan: ml_models -> ml_models_converted. File asal TIDAK diubah.

PENTING: skrip ini memakai weights_only=False, jadi HANYA jalankan pada file .pt buatanmu
sendiri. Jangan pernah pada file dari sumber yang tidak dipercaya.
"""
import sys
from pathlib import Path

import numpy as np
import torch


def plain(x):
    if isinstance(x, torch.Tensor):
        return x
    if isinstance(x, np.ndarray):
        return x.tolist()
    if isinstance(x, np.generic):
        return x.item()
    if isinstance(x, dict):
        return type(x)((k, plain(v)) for k, v in x.items())
    if isinstance(x, (list, tuple)):
        return type(x)(plain(v) for v in x)
    return x


src = Path(sys.argv[1] if len(sys.argv) > 1 else "ml_models")
dst = Path(sys.argv[2] if len(sys.argv) > 2 else "ml_models_converted")
dst.mkdir(exist_ok=True)
files = sorted(src.glob("ft_*.pt"))
if not files:
    sys.exit(f"Tidak ada ft_*.pt di {src}")
for pt in files:
    ck = plain(torch.load(pt, map_location="cpu", weights_only=False))
    torch.save(ck, dst / pt.name)
    torch.load(dst / pt.name, map_location="cpu", weights_only=True)      # pastikan lolos mode aman
    print(f"OK  {pt.name}: y_mu={ck['y_mu']}  y_sd={ck['y_sd']}")
print(f"\nSelesai. Salin file dari {dst}/ ke {src}/ (timpa), bersama prep_*.pkl hasil ekspor ulang.")
