// A frame loop for the arcade games: calls `step` with the milliseconds since
// the last frame (capped, so a background tab doesn't jump) until it returns
// false or the returned stop function is called.
export function loop(step: (dt: number, now: number) => boolean | void): () => void {
  let last = performance.now();
  let frame = requestAnimationFrame(function tick(now) {
    const dt = Math.min(64, now - last);
    last = now;
    if (step(dt, now) === false) return;
    frame = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(frame);
}
