function createConfetti() {

    if (document.getElementById('confetti-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const cheers = document.createElement('div');
    const style = document.createElement('style');
    // if it works it works, ig haha
    style.textContent = `@keyframes sp_cheers_anim{0%{opacity:0;transform:translate(-50%,50vh)}50%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(-50%,-150%)}} #cheers{animation:sp_cheers_anim 3s ease-in-out forwards}`;
    document.head.appendChild(style);

    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);

    const particles = [];
    const colors = ['#c1121f','#2a9d8f','#e9c46a','#264653','#023e8a','#ff7b54','#f9c74f'];
    const total = 200;

    function createParticle() {
        return {
            x: Math.random() * W,
            y: Math.random() * -H,
            size: Math.random() * 6 + 3,
            speedX: (Math.random() - 0.5) * 4,
            speedY: Math.random() * 4 + 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            wobble: Math.random() * 0.5 + 0.5
        };
    }

    for (let i = 0; i < total; i++) particles.push(createParticle());

    let rafId = null;
    let start = null;
    const duration = 3500; // ms

    function drawParticle(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);
        ctx.restore();
    }

    function animate(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;

        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            drawParticle(p);
            p.x += p.speedX + Math.sin(p.y * 0.05) * p.wobble;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;

            if (p.y > H + 20) {
                p.y = Math.random() * -H;
                p.x = Math.random() * W;
            }
        }

        if (elapsed < duration) {
            rafId = requestAnimationFrame(animate);
        } else {
            // fade out and cleanup
            canvas.style.transition = 'opacity 600ms ease-out';
            canvas.style.opacity = '0';
            cheers.style.transition = 'opacity 600ms ease-out, transform 600ms ease-out';
            cheers.style.opacity = '0';
            setTimeout(cleanup, 700);
        }
    }

    function cleanup() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (cheers.parentNode) cheers.parentNode.removeChild(cheers);
        if (style.parentNode) style.parentNode.removeChild(style);
    }

    // kick off
    // ensure initial render shows cheers animation
    requestAnimationFrame(function(ts){
        // show cheers via animation keyframes
        cheers.style.opacity = '1';
        rafId = requestAnimationFrame(animate);
    });
}
function celebrate() {
    createConfetti();
}

window.SPEffects = {
    celebrate: celebrate
};
