#!/usr/bin/env bash
#
# retouch.sh — measure, grade and verify a folder of photographs.
#
# Pure bash + ImageMagick. No npm packages, no jq, no python: this skill ships
# inside a template that other people clone, so the only thing it may assume is
# a POSIX shell and one well-known binary. When that binary is missing the
# script says so and exits 3, and every caller treats 3 as "skip, don't fail".
#
# Subcommands:
#   check                       report the ImageMagick tier, or how to install it
#   measure <dir> [artifacts]   read-only stats + contact sheets (no writes to <dir>)
#   apply   <plan>              back up originals, grade, write output
#   verify  <plan>              re-measure, auto-revert regressions, montage
#   restore <plan>              put every original back
#
set -uo pipefail

SELF="$(basename "$0")"

# ---------------------------------------------------------------------------
# ImageMagick detection
# ---------------------------------------------------------------------------
# IM7 exposes one `magick` entry point; IM6 uses separate binaries and its
# `convert` is what `magick` replaced. Support both — a teammate on a distro
# that still packages IM6 should not get a skip.
IM=""; IM_ID=""; IM_MONTAGE=""; IM_TIER=""
detect_im() {
  if command -v magick >/dev/null 2>&1; then
    IM="magick"; IM_ID="magick identify"; IM_MONTAGE="magick montage"
    IM_TIER="$(magick -version 2>/dev/null | head -1 | sed -E 's/^Version: ImageMagick ([^ ]+).*/\1/')"
    return 0
  fi
  if command -v convert >/dev/null 2>&1 && command -v identify >/dev/null 2>&1; then
    IM="convert"; IM_ID="identify"; IM_MONTAGE="montage"
    IM_TIER="$(convert -version 2>/dev/null | head -1 | sed -E 's/^Version: ImageMagick ([^ ]+).*/\1/')"
    return 0
  fi
  return 1
}

install_hint() {
  cat >&2 <<'EOF'
Photo retouching needs ImageMagick, which was not found on PATH.

  macOS    brew install imagemagick
  Debian   sudo apt install imagemagick
  Fedora   sudo dnf install ImageMagick
  Windows  choco install imagemagick

Nothing else in this project depends on it — the site builds and deploys
without it. Photos are simply used as-is.
EOF
}

require_im() {
  if ! detect_im; then install_hint; exit 3; fi
}

# ---------------------------------------------------------------------------
# A font montage can actually draw with
# ---------------------------------------------------------------------------
# The contact sheets are only useful because each thumbnail carries its
# filename — that label is how the looking step maps a picture back to a plan
# line. But a Homebrew ImageMagick is routinely built with no font
# configuration at all (`magick -list font` reports zero), and then
# `-label` fails with "unable to read font ''". montage still writes an
# image, so without this the sheets come out silently unlabelled and the
# whole vision pass becomes a guessing game.
#
# Font *files* work even when no font is registered, so probe real paths by
# rendering with them and keep the first that succeeds.
IM_FONT=""
FONT_RESOLVED=""
resolve_font() {
  [ -n "$FONT_RESOLVED" ] && return 0
  FONT_RESOLVED=1
  local f
  for f in \
    /System/Library/Fonts/Helvetica.ttc \
    /System/Library/Fonts/Supplemental/Arial.ttf \
    /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf \
    /usr/share/fonts/dejavu/DejaVuSans.ttf \
    /usr/share/fonts/TTF/DejaVuSans.ttf \
    /usr/share/fonts/liberation-sans/LiberationSans-Regular.ttf \
    C:/Windows/Fonts/arial.ttf
  do
    [ -f "$f" ] || continue
    if $IM -size 40x16 xc:black -font "$f" -pointsize 10 -fill white \
         -annotate +2+12 'x' png:- >/dev/null 2>&1; then
      IM_FONT="$f"; return 0
    fi
  done
  printf '%s: warning: no usable font found — contact sheets will be unlabelled.\n' "$SELF" >&2
  return 0
}

# Emit the label flags for montage, or nothing when no font could be resolved.
# Callers splat this into the command line, so an unlabelled sheet still gets
# written rather than the run dying on a cosmetic detail.
montage_label_args() {
  resolve_font
  [ -n "$IM_FONT" ] || return 0
  printf '%s\n' -font "$IM_FONT" -label '%f' -fill '#dddddd' -pointsize 15
}

die() { printf '%s: %s\n' "$SELF" "$1" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Which files are photographs
# ---------------------------------------------------------------------------
# Flat brand art is not photography: grading a logo shifts the brand colour and
# an alpha channel makes the masked operators composite against garbage. Small
# images are thumbnails or icons — derived assets whose source gets graded
# instead, so touching them would double-process.
MIN_EDGE=400
is_gradable() {
  local f="$1" base w h alpha
  # Lowercased with tr, not ${x,,} — macOS still ships bash 3.2 and this skill
  # travels to whatever shell a teammate has.
  base="$(basename "$f" | tr '[:upper:]' '[:lower:]')"
  case "$base" in
    logo*|*logo.*|favicon*|apple-touch*|android-chrome*|mstile*|og-image*|*.svg|*.ico) return 1 ;;
  esac
  # The trailing \n matters: without it `read` hits EOF and reports failure even
  # though it filled the variables.
  read -r w h alpha < <($IM_ID -format '%w %h %A\n' "$f" 2>/dev/null)
  [ -z "${w:-}" ] && return 1
  case "$w" in ''|*[!0-9]*) return 1 ;; esac
  [ "$w" -lt "$MIN_EDGE" ] && [ "$h" -lt "$MIN_EDGE" ] && return 1
  case "$alpha" in True|true|Blend) return 1 ;; esac
  return 0
}

list_images() {
  find "$1" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \
    -o -iname '*.webp' -o -iname '*.tif' -o -iname '*.tiff' -o -iname '*.heic' \) \
    | LC_ALL=C sort
}

# ---------------------------------------------------------------------------
# Measurement
# ---------------------------------------------------------------------------
# Four numbers decide almost every real correction:
#   cast        mean.r - mean.b, in 0-255. Tungsten pushes it positive.
#   shadowclip  % of pixels crushed below 2% — detail that no longer exists
#   highclip    % blown past 98%
#   sd          contrast. A low sd on a bright mean is the classic flat photo.
# Reported as TSV so bash can read it back in verify without a JSON parser.
stats_of() {
  local f="$1" sc hc prof w h mean sd r g b mx
  # ImageMagick's -format does not expand \t, so fields come back space
  # separated and printf rebuilds them as the TSV that verify reads.
  read -r w h mean sd r g b mx < <($IM "$f" -format \
    '%w %h %[fx:int(mean*255)] %[fx:int(standard_deviation*255)] %[fx:int(mean.r*255)] %[fx:int(mean.g*255)] %[fx:int(mean.b*255)] %[fx:int(maxima*255)]\n' \
    info: 2>/dev/null)
  [ -n "${w:-}" ] || return 1
  # Clipping is counted on a quarter-scale copy, and that detail is what makes
  # the guard in `verify` mean anything.
  #
  # Unsharp masking — both the `clarity` stage and the output `sharpen` — puts
  # a dark halo on the dark side of every edge. In a frame full of fine detail
  # (chair spindles, wainscoting, railings) those halos are hundreds of
  # thousands of genuinely-black pixels, so a full-resolution count reads them
  # as crushed shadows. Measured on this build's hero frame: sharpening alone
  # took shadow clipping from 1.40% to 2.86% while the shadow lift in the same
  # grade *reduced* it to 0.87%. The guard was reverting correct grades and
  # could not tell a good one from a deliberately ruinous one — full-res, a
  # clean grade scored 3.45 and a sigmoidal 8,60% disaster scored 15.0, both
  # "fail". Downsampling averages a one-pixel halo away while a genuinely
  # crushed region survives: the same three images then score 0.93 (better
  # than the 1.17 original), 1.29, and 12.23.
  #
  # A halo you cannot see at normal viewing size is not lost detail.
  sc=$($IM "$f" -resize 25% -colorspace gray -threshold 2%  -format '%[fx:100*(1-mean)]' info: 2>/dev/null)
  hc=$($IM "$f" -resize 25% -colorspace gray -threshold 98% -format '%[fx:100*mean]'     info: 2>/dev/null)
  prof=$($IM_ID -format '%[profile:icc]\n' "$f" 2>/dev/null | head -1); [ -z "$prof" ] && prof="none"
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%.2f\t%.2f\t%s\n' \
    "$w" "$h" "$mean" "$sd" "$r" "$g" "$b" "$mx" "${sc:-0}" "${hc:-0}" "$prof"
}

# Saturation measured in HSB, not HSL. HSL's denominator collapses near white,
# so merely darkening a bright photo inflates its HSL saturation — measured on
# hero-bg.jpg, a vibrance=5 grade read as +43% in HSL and 0% in HSB.
sat_of() {
  $IM "$1" -colorspace HSB -channel G -separate +channel \
    -format '%[fx:int(mean*255)]\n' info: 2>/dev/null | head -1
}

cmd_measure() {
  local dir="${1:-}" art="${2:-extraction/retouch}"
  [ -d "$dir" ] || die "not a directory: $dir"
  mkdir -p "$art"
  local tsv="$art/measure.tsv" sheetlist="$art/.sheet-inputs"
  : > "$tsv"; : > "$sheetlist"

  printf 'file\tw\th\tmean\tsd\tR\tG\tB\tmax\tshadowclip\thighclip\tprofile\n' >> "$tsv"

  local f n=0 skipped=0
  while IFS= read -r f; do
    if ! is_gradable "$f"; then skipped=$((skipped+1)); continue; fi
    local s; s="$(stats_of "$f")" || { skipped=$((skipped+1)); continue; }
    printf '%s\t%s\n' "${f#"$dir"/}" "$s" >> "$tsv"
    printf '%s\n' "$f" >> "$sheetlist"
    n=$((n+1))
  done < <(list_images "$dir")

  # Contact sheets keep the vision pass affordable: nine labelled thumbnails per
  # sheet costs the same to look at whether the folder holds 12 photos or 200.
  rm -f "$art"/sheet-*.jpg
  local sheet=1
  batch=()
  flush_sheet() {
    [ ${#batch[@]} -eq 0 ] && return 0
    local LBL=(); while IFS= read -r a; do LBL[${#LBL[@]}]="$a"; done < <(montage_label_args)
    $IM_MONTAGE ${LBL[@]+"${LBL[@]}"} "${batch[@]}" -tile 3x3 -geometry 400x400+10+10 \
      -background '#1a1a1a' \
      "$art/sheet-$sheet.jpg"
    sheet=$((sheet+1)); batch=()
  }
  while IFS= read -r f; do
    batch[${#batch[@]}]="$f"
    [ ${#batch[@]} -eq 9 ] && flush_sheet
  done < "$sheetlist"
  flush_sheet
  rm -f "$sheetlist"

  printf '%s: measured %d photo(s), skipped %d non-photo/too-small file(s)\n' "$SELF" "$n" "$skipped"
  printf 'stats:         %s\n' "$tsv"
  printf 'contact sheets: %s/sheet-*.jpg\n' "$art"
}

# ---------------------------------------------------------------------------
# Plan parsing
# ---------------------------------------------------------------------------
# Plain text, not JSON, so no jq. Directives, then one line per image:
#
#   @source    src/assets/images
#   @originals photo-originals
#   @artifacts extraction/retouch
#   @output    format=preserve quality=86     (maxedge resizes; omit on a live site)
#
#   sushi.jpg | wb=0.98,1.00,1.05 gamma=1.05 levels=0.4,0.1 shadows=18 | warm cast
#
# Every op is optional. An image with no ops listed is deliberately left alone —
# "needs nothing" has to be expressible, or restraint is impossible.
P_SOURCE=""; P_ORIG=""; P_ART=""; P_FORMAT="preserve"; P_MAXEDGE="0"; P_QUALITY="86"
read_directives() {
  local plan="$1" key rest
  P_SOURCE=""; P_ORIG="photo-originals"; P_ART="extraction/retouch"
  P_FORMAT="preserve"; P_MAXEDGE="0"; P_QUALITY="86"
  while IFS= read -r line; do
    case "$line" in
      '@'*) ;;
      *) continue ;;
    esac
    key="${line%%[[:space:]]*}"; rest="${line#"$key"}"; rest="$(printf '%s' "$rest" | sed 's/^[[:space:]]*//')"
    case "$key" in
      @source)    P_SOURCE="$rest" ;;
      @originals) P_ORIG="$rest" ;;
      @artifacts) P_ART="$rest" ;;
      @output)
        for kv in $rest; do
          case "$kv" in
            format=*)  P_FORMAT="${kv#format=}" ;;
            maxedge=*) P_MAXEDGE="${kv#maxedge=}" ;;
            quality=*) P_QUALITY="${kv#quality=}" ;;
          esac
        done ;;
    esac
  done < "$plan"
  [ -n "$P_SOURCE" ] || die "plan is missing an @source directive"
  [ -d "$P_SOURCE" ] || die "@source is not a directory: $P_SOURCE"
}

# ---------------------------------------------------------------------------
# The grade
# ---------------------------------------------------------------------------
# Order is the craft. White balance before anything tonal, because correcting a
# cast after boosting saturation bakes the cast into the boost. Sharpening dead
# last and after the resize, because sharpening for 2000px and then shrinking to
# 1200 throws the sharpening away. The plan supplies parameters; it cannot
# reorder these stages or add operators outside this set.
build_ops() {
  local spec="$1"
  ARGS=()

  local wb="" gamma="" levels="" curve="" shadows="" highlights="" \
        vibrance="" clarity="" sharpen=""
  for kv in $spec; do
    case "$kv" in
      wb=*)         wb="${kv#wb=}" ;;
      gamma=*)      gamma="${kv#gamma=}" ;;
      levels=*)     levels="${kv#levels=}" ;;
      curve=*)      curve="${kv#curve=}" ;;
      shadows=*)    shadows="${kv#shadows=}" ;;
      highlights=*) highlights="${kv#highlights=}" ;;
      vibrance=*)   vibrance="${kv#vibrance=}" ;;
      clarity=*)    clarity="${kv#clarity=}" ;;
      sharpen=*)    sharpen="${kv#sharpen=}" ;;
      '') ;;
      *) printf '%s: warning: unknown op "%s" ignored\n' "$SELF" "$kv" >&2 ;;
    esac
  done

  # 1. Orientation, then colour management. A phone photo carries its rotation
  #    in EXIF, and a camera photo is often Display P3 or Adobe RGB — pushed to
  #    the web untagged it reads dull or lurid. lcms does the transform here.
  ARGS+=(-auto-orient -colorspace sRGB)

  # 2. White balance, in linear light. Channel gains are a physical operation;
  #    applying them to gamma-encoded values bends hues as it corrects them.
  if [ -n "$wb" ]; then
    local r g b; IFS=, read -r r g b <<< "$wb"
    ARGS+=(-colorspace RGB
           -channel R -evaluate multiply "${r:-1}" +channel
           -channel G -evaluate multiply "${g:-1}" +channel
           -channel B -evaluate multiply "${b:-1}" +channel
           -colorspace sRGB)
  fi

  # 3. Exposure.
  [ -n "$gamma" ] && ARGS+=(-gamma "$gamma")

  # 4. Black and white point, on LAB lightness only. The plain form stretches
  #    each RGB channel independently, which is a second, uncontrolled white
  #    balance fighting the one above.
  if [ -n "$levels" ]; then
    local lo hi; IFS=, read -r lo hi <<< "$levels"
    ARGS+=(-colorspace LAB -channel R -contrast-stretch "${lo:-0}%x${hi:-0}%" +channel -colorspace sRGB)
  fi

  # 5. Tone curve — sigmoidal, not linear contrast. It rolls off into the
  #    shoulders instead of clipping them, which is why it looks photographic.
  if [ -n "$curve" ]; then
    local a b; IFS=, read -r a b <<< "$curve"
    ARGS+=(-sigmoidal-contrast "${a:-3},${b:-50}%")
  fi

  # 6. Shadow lift / highlight recovery: a brightened (or darkened) copy
  #    composited through a luminance mask, so the correction lands only where
  #    it is needed and the rest of the frame is untouched.
  if [ -n "$shadows" ] && [ "$shadows" != "0" ]; then
    local sg; sg=$(awk -v a="$shadows" 'BEGIN{printf "%.3f", 1 + (a/100)*0.6}')
    ARGS+=( \( -clone 0 -gamma "$sg" \) \( -clone 0 -colorspace gray -negate \) -composite )
  fi
  if [ -n "$highlights" ] && [ "$highlights" != "0" ]; then
    local hg; hg=$(awk -v a="$highlights" 'BEGIN{printf "%.3f", 1 - (a/100)*0.35}')
    ARGS+=( \( -clone 0 -gamma "$hg" \) \( -clone 0 -colorspace gray \) -composite )
  fi

  # 7. Vibrance, not saturation: the boost is masked by inverse saturation, so
  #    muted tones come up while an already-vivid sauce or logo is left alone.
  #    Flat saturation is what makes automated grading look cheap.
  if [ -n "$vibrance" ] && [ "$vibrance" != "0" ]; then
    local vs; vs=$(awk -v a="$vibrance" 'BEGIN{printf "%d", 100 + a}')
    ARGS+=( \( -clone 0 -modulate "100,$vs,100" \) \
            \( -clone 0 -colorspace HSL -channel G -separate +channel -negate \) -composite )
  fi

  # 8. Local contrast: a large-radius, low-amount unsharp. Reads as depth
  #    rather than sharpening.
  if [ -n "$clarity" ]; then
    local cr ca; IFS=, read -r cr ca <<< "$clarity"
    ARGS+=(-unsharp "0x${cr:-15}+${ca:-0.15}+0")
  fi

  # 9. Resize, then 10. output sharpening — in that order, always.
  if [ "$P_MAXEDGE" != "0" ]; then
    ARGS+=(-resize "${P_MAXEDGE}x${P_MAXEDGE}>")
  fi
  if [ -n "$sharpen" ]; then
    local sr sa st; IFS=, read -r sr sa st <<< "$sharpen"
    ARGS+=(-unsharp "0x${sr:-1}+${sa:-0.6}+${st:-0.02}")
  fi

  ARGS+=(-strip -quality "$P_QUALITY")
}

out_path_for() {
  local rel="$1"
  if [ "$P_FORMAT" = "preserve" ]; then printf '%s/%s\n' "$P_SOURCE" "$rel"
  else printf '%s/%s.%s\n' "$P_SOURCE" "${rel%.*}" "$P_FORMAT"; fi
}

cmd_apply() {
  local plan="${1:-}"
  [ -f "$plan" ] || die "no such plan: $plan"
  read_directives "$plan"
  mkdir -p "$P_ORIG" "$P_ART"

  local n=0 noop=0 fail=0
  while IFS= read -r line; do
    case "$line" in ''|'#'*|'@'*) continue ;; esac
    local rel spec
    rel="$(printf '%s' "$line" | cut -d'|' -f1 | sed 's/[[:space:]]*$//;s/^[[:space:]]*//')"
    spec="$(printf '%s' "$line" | cut -d'|' -f2)"
    [ -n "$rel" ] || continue

    local src="$P_SOURCE/$rel"
    local bak="$P_ORIG/$rel"

    # Back up before the first touch, and treat an existing backup as proof the
    # photo is known — never as a file to overwrite.
    #
    # The backup, not the source, is what makes a second round possible. When
    # the output format differs from the input (jpg in, webp out) the first
    # round deletes the source, so on round two `$src` is gone for exactly the
    # images round one graded successfully. Testing `$src` alone would skip
    # every one of them with a "not found" warning and silently ignore the
    # revised plan — while the images that were auto-reverted, and so still had
    # their source, would re-grade. That is backwards: the reverted ones are
    # the ones already back to baseline. Grading always reads `$bak`, so as
    # long as the backup exists the round can run, and rounds never compound.
    if [ ! -f "$bak" ]; then
      [ -f "$src" ] || { printf '%s: warning: %s not found, skipped\n' "$SELF" "$rel" >&2; continue; }
      mkdir -p "$(dirname "$bak")"
      cp -p "$src" "$bak"
    fi

    if [ -z "$(printf '%s' "$spec" | tr -d '[:space:]')" ]; then
      noop=$((noop+1)); continue
    fi

    build_ops "$spec"
    local out; out="$(out_path_for "$rel")"
    if $IM "$bak" "${ARGS[@]}" "$out" 2>/dev/null; then
      # Format changes leave the old file behind; drop it so the site does not
      # ship both and the data files have one obvious path to point at.
      [ "$out" != "$src" ] && rm -f "$src"
      n=$((n+1))
    else
      printf '%s: FAILED to grade %s — original left in place\n' "$SELF" "$rel" >&2
      fail=$((fail+1))
    fi
  done < "$plan"

  printf '%s: graded %d, left alone %d, failed %d\n' "$SELF" "$n" "$noop" "$fail"
  printf 'originals: %s/\n' "$P_ORIG"
}

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------
# The point of this step is that a grade can be objectively worse, and an
# automated pass should notice without a human. Any image that lost detail it
# had before goes back to its original and is named in the report.
# A regression has to be both relative and absolute. Recovering four points of
# crushed shadow while blowing 0.9% of highlights is a trade a photo editor
# makes on purpose, so a bare "any increase" rule reverts good work. Damage is
# when clipping both grows AND ends up somewhere visible.
# Saturation is judged as growth against the image's own original, never as an
# absolute number. Measured in HSB on this template's photos: kobe-trio starts
# at 169 mean saturation while a grotesquely over-vibranced sushi only reaches
# 125 — a fixed ceiling would revert the naturally vivid photo and wave the
# ruined one through. Restrained grading lands at or under 1.0x; 1.33x is
# visibly plastic.
CLIP_TOLERANCE="0.5"   # percentage points of new clipping before it counts
CLIP_FLOOR="2.0"       # below this share of the frame, clipping is not visible
SAT_GROWTH="1.25"      # multiple of the original's mean saturation (HSB)
MEAN_DRIFT="25"        # points of overall brightness, out of 255
cmd_verify() {
  local plan="${1:-}"
  [ -f "$plan" ] || die "no such plan: $plan"
  read_directives "$plan"
  mkdir -p "$P_ART"
  local report="$P_ART/verify.tsv"
  printf 'file\tverdict\tshadowclip\thighclip\tmean\tsat\tnote\n' > "$report"

  local reverted=0 ok=0
  while IFS= read -r line; do
    case "$line" in ''|'#'*|'@'*) continue ;; esac
    local rel spec
    rel="$(printf '%s' "$line" | cut -d'|' -f1 | sed 's/[[:space:]]*$//;s/^[[:space:]]*//')"
    spec="$(printf '%s' "$line" | cut -d'|' -f2)"
    [ -n "$rel" ] || continue
    [ -z "$(printf '%s' "$spec" | tr -d '[:space:]')" ] && continue

    local bak="$P_ORIG/$rel" out; out="$(out_path_for "$rel")"
    [ -f "$bak" ] && [ -f "$out" ] || continue

    local b a
    b="$(stats_of "$bak")"; a="$(stats_of "$out")"
    local b_sc b_hc a_sc a_hc a_mean a_sat
    b_sc=$(printf '%s' "$b" | cut -f9);  b_hc=$(printf '%s' "$b" | cut -f10)
    a_sc=$(printf '%s' "$a" | cut -f9);  a_hc=$(printf '%s' "$a" | cut -f10)
    a_mean=$(printf '%s' "$a" | cut -f3)
    local b_sat
    b_sat=$(sat_of "$bak"); a_sat=$(sat_of "$out")

    local verdict="ok" note=""
    if awk -v x="$a_sc" -v y="$b_sc" -v t="$CLIP_TOLERANCE" -v f="$CLIP_FLOOR" \
         'BEGIN{exit !(x > y + t && x > f)}'; then
      verdict="revert"; note="shadow clipping $b_sc% -> $a_sc%"
    elif awk -v x="$a_hc" -v y="$b_hc" -v t="$CLIP_TOLERANCE" -v f="$CLIP_FLOOR" \
         'BEGIN{exit !(x > y + t && x > f)}'; then
      verdict="revert"; note="highlight clipping $b_hc% -> $a_hc%"
    elif [ -n "$a_sat" ] && [ -n "$b_sat" ] && [ "$b_sat" -gt 0 ] && \
         awk -v x="$a_sat" -v y="$b_sat" -v g="$SAT_GROWTH" 'BEGIN{exit !(x > y*g)}'; then
      verdict="revert"; note="oversaturated (mean saturation $b_sat -> $a_sat)"
    else
      # A touch-up corrects a photo; it does not re-expose it. A large shift in
      # overall brightness means the parameters were wrong, even when nothing
      # clipped.
      local b_mean drift
      b_mean=$(printf '%s' "$b" | cut -f3)
      drift=$(( a_mean > b_mean ? a_mean - b_mean : b_mean - a_mean ))
      if [ "$drift" -gt "$MEAN_DRIFT" ]; then
        verdict="revert"; note="brightness moved $b_mean -> $a_mean (limit $MEAN_DRIFT)"
      fi
    fi

    if [ "$verdict" = "revert" ]; then
      cp -p "$bak" "$P_SOURCE/$rel"
      [ "$out" != "$P_SOURCE/$rel" ] && rm -f "$out"
      reverted=$((reverted+1))
      printf '%s: REVERTED %s — %s\n' "$SELF" "$rel" "$note" >&2
    else
      ok=$((ok+1))
      # Before/after pair, so the final visual check is a comparison rather
      # than a memory test.
      local LBL=(); while IFS= read -r a; do LBL[${#LBL[@]}]="$a"; done < <(montage_label_args)
      $IM_MONTAGE ${LBL[@]+"${LBL[@]}"} "$bak" "$out" -tile 2x1 -geometry 640x640+8+8 \
        -background '#1a1a1a' \
        "$P_ART/ba-$(printf '%s' "${rel%.*}" | tr '/' '_').jpg"
    fi
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$rel" "$verdict" "$a_sc" "$a_hc" "$a_mean" "${a_sat:-}" "$note" >> "$report"
  done < "$plan"

  printf '%s: %d kept, %d reverted\n' "$SELF" "$ok" "$reverted"
  printf 'report:        %s\n' "$report"
  printf 'before/after:  %s/ba-*.jpg\n' "$P_ART"
}

cmd_restore() {
  local plan="${1:-}"
  [ -f "$plan" ] || die "no such plan: $plan"
  read_directives "$plan"
  [ -d "$P_ORIG" ] || die "no originals directory: $P_ORIG"
  local n=0 f rel
  while IFS= read -r f; do
    rel="${f#"$P_ORIG"/}"
    mkdir -p "$(dirname "$P_SOURCE/$rel")"
    cp -p "$f" "$P_SOURCE/$rel"
    if [ "$P_FORMAT" != "preserve" ]; then rm -f "$P_SOURCE/${rel%.*}.$P_FORMAT"; fi
    n=$((n+1))
  done < <(find "$P_ORIG" -type f | LC_ALL=C sort)
  printf '%s: restored %d file(s) from %s/\n' "$SELF" "$n" "$P_ORIG"
}

cmd_check() {
  if detect_im; then
    printf '%s: ImageMagick %s (%s) — photo retouching available\n' "$SELF" "$IM_TIER" "$IM"
    exit 0
  fi
  install_hint
  exit 3
}

usage() {
  cat >&2 <<EOF
usage: $SELF check
       $SELF measure <image-dir> [artifact-dir]
       $SELF apply   <plan-file>
       $SELF verify  <plan-file>
       $SELF restore <plan-file>

Exit 3 means ImageMagick is missing — callers should skip retouching and
carry on, not fail the build.
EOF
  exit 64
}

case "${1:-}" in
  check)   cmd_check ;;
  measure) require_im; shift; cmd_measure "$@" ;;
  apply)   require_im; shift; cmd_apply "$@" ;;
  verify)  require_im; shift; cmd_verify "$@" ;;
  restore) require_im; shift; cmd_restore "$@" ;;
  *)       usage ;;
esac
