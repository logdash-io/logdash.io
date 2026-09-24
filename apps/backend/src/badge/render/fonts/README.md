# Badge fonts

Inter 4.1 Regular and SemiBold, under the SIL Open Font License in `OFL.txt`.
Badges draw their text as outlines of these files, so they render the same on every device.

The files are cut down from the release TTFs in `extras/ttf/` of `Inter-4.1.zip`.
They keep Latin, Greek and Cyrillic and only the `kern` feature, which brings each file down to about 120 KB.
Inter stores its kerning in GPOS extension lookups, which opentype.js cannot read, so the last step unwraps them into plain pair adjustment lookups.

```sh
for weight in Regular SemiBold; do
  python3 -m fontTools.subset "Inter-$weight.ttf" \
    --unicodes="U+0020-007E,U+00A0-024F,U+0370-03FF,U+0400-052F,U+1E00-1EFF,U+2000-206F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2212" \
    --layout-features=kern --drop-tables+=GSUB --no-hinting \
    --output-file="subset-$weight.ttf"
  python3 - "subset-$weight.ttf" "Inter-$weight.ttf" <<'PY'
import sys
from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
for lookup in font['GPOS'].table.LookupList.Lookup:
    if lookup.LookupType == 9:
        lookup.SubTable = [subtable.ExtSubTable for subtable in lookup.SubTable]
        lookup.LookupType = lookup.SubTable[0].LookupType
        lookup.SubTableCount = len(lookup.SubTable)
font.save(sys.argv[2])
PY
done
```
