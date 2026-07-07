/**
 * qa-fixture.ts — the deliberately-broken regression slide. It violates
 * every QA rule at once and MUST fail the gate; if it ever passes, the gate
 * itself is broken. Never render this into a review package.
 */
export function badSlide(): string {
  return `
  <div style="position:relative;width:var(--reel-w);height:var(--reel-h);background:#888888;overflow:visible;">
    <!-- no KURIMASENSE mark anywhere → logo -->
    <!-- clip: starts off-canvas left; also outside reel safe zone (y=80) -->
    <div class="t-display" style="position:absolute;left:-60px;top:80px;color:#909090;font-size:64px;">Clipped headline way off the edge</div>
    <!-- overlap: two blocks on the same spot -->
    <div class="t-display" style="position:absolute;left:200px;top:900px;color:#8a8a8a;font-size:70px;">First stacked title</div>
    <div class="t-display" style="position:absolute;left:210px;top:930px;color:#8f8f8f;font-size:70px;">Second stacked title</div>
    <!-- min-size + contrast: 14px grey on grey -->
    <div class="t-body" style="position:absolute;left:200px;top:1200px;color:#7e7e7e;font-size:14px;">tiny unreadable footnote</div>
    <!-- brand-font: hardcoded foreign font + non-token colour -->
    <div style="position:absolute;left:200px;top:1300px;font-family:Georgia,serif;font-size:40px;color:#ff00ff;">Wrong font, wrong colour</div>
    <!-- highlight-lead: highlight with crushed leading -->
    <div class="t-display" style="position:absolute;left:200px;top:1450px;color:#9a9a9a;font-size:64px;line-height:0.8;">Crushed <span class="hl">highlight</span><br/>leading</div>
  </div>`;
}
