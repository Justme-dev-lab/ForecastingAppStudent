"""Preprocessor. Disalin dari notebook (class TabPrep).
File prep_*.pkl menyimpan objek dengan nama `__main__.TabPrep`; loader.py
mengarahkannya ke class ini."""
import numpy as np
from sklearn.preprocessing import QuantileTransformer


class TabPrep:
    def __init__(self, num_cols, cat_cols, seed=0, noise=1e-3):
        self.num_cols, self.cat_cols, self.seed, self.noise = num_cols, cat_cols, seed, noise

    def fit(self, d):  # hanya dipakai saat training; disertakan agar class lengkap
        if self.num_cols:
            X = d[self.num_cols].astype(float)
            self.med = X.median()
            X = X.fillna(self.med).values
            std = X.std(0, keepdims=True)
            rng = np.random.RandomState(self.seed)
            scale = np.where(std > 0, self.noise / np.maximum(std, self.noise), 0.0)
            self.qt = QuantileTransformer(n_quantiles=min(1000, len(X)), output_distribution="normal",
                                          subsample=10**9, random_state=self.seed).fit(X + scale * rng.randn(*X.shape))
        self.vocab = {c: {v: i + 1 for i, v in enumerate(sorted(d[c].astype(str).unique()))} for c in self.cat_cols}
        self.cards = [len(self.vocab[c]) + 1 for c in self.cat_cols]   # +1 untuk UNK (indeks 0)
        return self

    def transform(self, d):
        if self.num_cols:
            num = self.qt.transform(d[self.num_cols].astype(float).fillna(self.med).values).astype(np.float32)
        else:
            num = np.zeros((len(d), 0), np.float32)
        if self.cat_cols:
            cat = np.stack([d[c].astype(str).map(self.vocab[c]).fillna(0).astype(np.int64).values
                            for c in self.cat_cols], 1)
        else:
            cat = np.zeros((len(d), 0), np.int64)
        return num, cat
