// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('three-bg').appendChild(renderer.domElement);

camera.position.z = 5;

// Particle System
const particleCount = 1000;
const particlesGeometry = new THREE.BufferGeometry();
const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true
});

const particlesPositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    particlesPositions[i * 3] = (Math.random() - 0.5) * 10;
    particlesPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    particlesPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Animate particles
function animateParticles() {
    requestAnimationFrame(animateParticles);
    particles.rotation.y += 0.002;
    renderer.render(scene, camera);
}
animateParticles();

// GSAP Animations
gsap.from(".title-3d", { duration: 2, y: -50, opacity: 0, ease: "bounce" });
gsap.from(".hero h2", { duration: 1.5, y: -100, opacity: 0, delay: 1 });
gsap.from(".hero p", { duration: 1.5, y: -100, opacity: 0, delay: 1.5 });
gsap.from(".cta-button", { duration: 2, scale: 0, ease: "elastic", delay: 2 });

// Handle window resizing for Three.js canvas
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});