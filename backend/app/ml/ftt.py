"""Arsitektur FT-Transformer. Disalin dari notebook (sel "Arsitektur FT-Transformer").
JANGAN diubah: nama modul/parameter harus sama dengan saat training agar
state_dict cocok."""
import math

import torch
import torch.nn as nn
import torch.nn.functional as F


class FeatureTokenizer(nn.Module):
    def __init__(self, n_num, cards, d):
        super().__init__()
        self.n_num, self.d = n_num, d
        b = 1 / math.sqrt(d)
        self.num_w = nn.Parameter(torch.empty(n_num, d).uniform_(-b, b)) if n_num else None
        self.cat_emb = nn.ModuleList([nn.Embedding(c, d) for c in cards])
        for e in self.cat_emb:
            nn.init.uniform_(e.weight, -b, b)
        nb = n_num + len(cards)
        self.bias = nn.Parameter(torch.empty(nb, d).uniform_(-b, b))
        self.cls = nn.Parameter(torch.empty(1, 1, d).uniform_(-b, b))

    def forward(self, xn, xc):
        toks = []
        if self.n_num:
            toks.append(xn.unsqueeze(-1) * self.num_w)                      # (B, n_num, d)
        if len(self.cat_emb):
            toks.append(torch.stack([e(xc[:, i]) for i, e in enumerate(self.cat_emb)], 1))
        x = torch.cat(toks, 1) + self.bias
        return torch.cat([self.cls.expand(x.shape[0], -1, -1), x], 1)       # [CLS] di indeks 0


class MHSA(nn.Module):
    def __init__(self, d, h, drop):
        super().__init__()
        self.h, self.dh = h, d // h
        self.q, self.k, self.v = nn.Linear(d, d), nn.Linear(d, d), nn.Linear(d, d)
        self.out = nn.Linear(d, d) if h > 1 else None
        self.drop = nn.Dropout(drop)
        self.keep, self.attn = False, None

    def forward(self, x):
        B, N, D = x.shape
        sp = lambda t: t.view(B, N, self.h, self.dh).transpose(1, 2)
        q, k, v = sp(self.q(x)), sp(self.k(x)), sp(self.v(x))
        att = ((q @ k.transpose(-1, -2)) / math.sqrt(self.dh)).softmax(-1)
        if self.keep:
            self.attn = att[:, :, 0, :].detach()
        o = (self.drop(att) @ v).transpose(1, 2).reshape(B, N, D)
        return self.out(o) if self.out is not None else o


class ReGLU(nn.Module):
    def forward(self, x):
        a, b = x.chunk(2, dim=-1)
        return a * F.relu(b)


class Block(nn.Module):
    def __init__(self, d, h, ffn_factor, attn_drop, ffn_drop, res_drop, first):
        super().__init__()
        self.n1 = nn.Identity() if first else nn.LayerNorm(d)
        self.attn = MHSA(d, h, attn_drop)
        self.n2 = nn.LayerNorm(d)
        dh = max(int(d * ffn_factor), 8)
        self.ff = nn.Sequential(nn.Linear(d, dh * 2), ReGLU(), nn.Dropout(ffn_drop), nn.Linear(dh, d))
        self.rd = nn.Dropout(res_drop)

    def forward(self, x):
        x = x + self.rd(self.attn(self.n1(x)))
        return x + self.rd(self.ff(self.n2(x)))


class FTTransformer(nn.Module):
    def __init__(self, n_num, cards, hp, n_out=1):
        super().__init__()
        d = hp["d_token"]
        self.tok = FeatureTokenizer(n_num, cards, d)
        self.blocks = nn.ModuleList([
            Block(d, hp["n_heads"], hp["d_ffn_factor"], hp["attention_dropout"], hp["ffn_dropout"],
                  hp["residual_dropout"], first=(i == 0)) for i in range(hp["n_layers"])])
        self.head = nn.Sequential(nn.LayerNorm(d), nn.ReLU(), nn.Linear(d, n_out))

    def forward(self, xn, xc):
        x = self.tok(xn, xc)
        for b in self.blocks:
            x = b(x)
        out = self.head(x[:, 0])
        return out.squeeze(-1) if out.shape[-1] == 1 else out    # (B,) bila 1 target, (B, n_out) bila banyak
