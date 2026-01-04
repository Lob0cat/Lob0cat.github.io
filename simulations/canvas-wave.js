export function init(container) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  let frame;
  let phase = 0;
  
  // Resize canvas to container
  function resize() {
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  // Animation loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const y = cy + Math.sin((x + phase) * 0.02) * 50;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    phase += 2;
    frame = requestAnimationFrame(draw);
  }
  draw();
  
  // Return cleanup function
  return {
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      canvas.remove();
    }
  };
}

export function destroy() {
  // Handled by instance.destroy()
}