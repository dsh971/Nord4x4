# Fonts

Both families are under the SIL Open Font License 1.1 (`OFL.txt`).

| File | Source | Notes |
|---|---|---|
| `Inter18pt-Regular.ttf`, `-Medium`, `-SemiBold` | Inter (The Inter Project Authors), the static 18 pt optical size from `ShuimoDS/Sumi-Design-System/fonts/` | Unchanged |
| `NotoSerifSC-Regular.ttf`, `-SemiBold` | Noto Serif SC (Google), from `@expo-google-fonts/noto-serif-sc` 0.4.4 | Subset to Latin, punctuation, arrows and the zone shapes (▲ ▼ ● ○); the full CJK font is about 10 MB per weight |

The subset was made with fontTools:

```
pyftsubset NotoSerifSC_400Regular.ttf --layout-features='*' --output-file=NotoSerifSC-Regular.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2010-2027,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2190-2193,U+2212,U+25B2,U+25BC,U+25CB,U+25CF"
```

Add a character outside that list (for example a CJK accent) and it falls back to the system font: re-run the subset with it included.
