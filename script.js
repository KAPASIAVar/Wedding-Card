// =========================================================================
// 1. WEB AUDIO SYNTHESIZER ENGINE (Chimes, Harp, Santoor, Piano Waltz & SFX)
// =========================================================================
const SoundEngine = {
    ctx: null,
    isPlaying: false,
    style: 'harp',
    loopTimer: null,
    stepIndex: 0,
    // URL-encode spaces in filenames
    customAudioSrc: 'track2.mp3', 
    audio: null,

    init() {
        if (!this.audio) {
            this.audio = document.getElementById('customWeddingAudio');
            if (!this.audio) {
                // Auto-create audio tag if missing in HTML
                this.audio = document.createElement('audio');
                this.audio.id = 'customWeddingAudio';
                this.audio.preload = 'auto';
                this.audio.playsInline = true;
                document.body.appendChild(this.audio);
            }
        }

        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playTone(freq, duration = 1.6, type = 'sine', gainLevel = 0.08, delay = 0) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const harmonic = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        harmonic.type = 'triangle';
        harmonic.frequency.setValueAtTime(freq * 2, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        harmonic.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        harmonic.start(now);
        osc.stop(now + duration + 0.05);
        harmonic.stop(now + duration + 0.05);
    },

    playEnvelopeUnseal() {
        this.init();
        const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 1046.50];
        scale.forEach((freq, idx) => {
            this.playTone(freq, 2.1, 'sine', 0.065, idx * 0.075);
        });
    },

    playWeddingBells() {
        this.init();
        const bells = [
            { f: 523.25, d: 0 },
            { f: 659.25, d: 0.14 },
            { f: 783.99, d: 0.28 },
            { f: 1046.50, d: 0.42 },
            { f: 783.99, d: 0.65 },
            { f: 1046.50, d: 0.85 },
            { f: 1318.51, d: 1.05 }
        ];
        bells.forEach(n => {
            this.playTone(n.f, 2.4, 'sine', 0.08, n.d);
            this.playTone(n.f * 1.5, 1.4, 'triangle', 0.03, n.d + 0.02);
        });
    },

    playSoftChime() {
        this.init();
        this.playTone(659.25, 0.55, 'sine', 0.04, 0);
        this.playTone(880.00, 0.7, 'sine', 0.035, 0.07);
    },

    startAmbientMusic() {
        this.init();
        if (this.loopTimer) clearInterval(this.loopTimer);
        this.loopTimer = null;

        if (this.customAudioSrc) {
            if (!this.audio) {
                showToast('Custom audio player is missing from the page.');
                return;
            }

            // Sync source if changed
            if (this.audio.src !== new URL(this.customAudioSrc, window.location.href).href) {
                this.audio.src = this.customAudioSrc;
                this.audio.load();
            }

            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                    this.updateUI();
                })
                .catch((error) => {
                    console.error('Audio playback failed:', error);
                    if (error.name === 'AbortError') return;
                    this.isPlaying = false;
                    this.updateUI();
                    showToast('Playback error: ' + error.message);
                });
            return;
        }

        if (this.audio) this.audio.pause();
        this.isPlaying = true;
        this.updateUI();

        const patterns = {
            harp: [
                [261.63, 392.00], [329.63], [440.00], [523.25],
                [587.33], [523.25], [392.00], [329.63],
                [293.66, 440.00], [349.23], [440.00], [587.33],
                [659.25], [523.25], [440.00], [392.00]
            ],
            sitar: [
                [261.63, 130.81], [293.66], [329.63], [369.99],
                [392.00], [440.00], [493.88], [523.25],
                [493.88], [440.00], [392.00], [369.99],
                [329.63, 196.00], [293.66], [261.63], [392.00]
            ],
            waltz: [
                [261.63, 523.25], [329.63, 392.00], [329.63, 392.00],
                [220.00, 440.00], [329.63, 523.25], [329.63, 523.25],
                [174.61, 349.23], [261.63, 440.00], [261.63, 440.00],
                [196.00, 392.00], [293.66, 493.88], [293.66, 493.88]
            ]
        };

        const playStep = () => {
            if (!this.isPlaying) return;
            const seq = patterns[this.style] || patterns.harp;
            const notes = seq[this.stepIndex % seq.length];
            const wave = this.style === 'sitar' ? 'triangle' : 'sine';
            notes.forEach((f, idx) => {
                this.playTone(f, 1.9, wave, idx === 0 ? 0.045 : 0.03, idx * 0.04);
            });
            this.stepIndex++;
        };

        playStep();
        this.loopTimer = setInterval(playStep, 580);
    },

    stopAmbientMusic() {
        this.isPlaying = false;
        if (this.loopTimer) {
            clearInterval(this.loopTimer);
            this.loopTimer = null;
        }
        if (this.audio) this.audio.pause();
        this.updateUI();
    },

    toggleMusic() {
        if (this.isPlaying) {
            this.stopAmbientMusic();
        } else {
            this.startAmbientMusic();
        }
    },

    updateUI() {
        const eq = document.getElementById('eqVisualizer');
        const label = document.getElementById('musicStatusLabel');
        const melodySelect = document.getElementById('melodySelect');
        if (melodySelect) melodySelect.hidden = Boolean(this.customAudioSrc);
        if (!eq || !label) return;
        if (this.isPlaying) {
            eq.classList.add('eq-playing');
            label.textContent = 'Music On';
        } else {
            eq.classList.remove('eq-playing');
            label.textContent = 'Music Paused';
        }
    }
};

// =========================================================================
// 2. FLOATING PETALS, JASMINE & FIREFLIES CANVAS ENGINE
// =========================================================================
const ParticleCanvas = {
    canvas: null,
    ctx: null,
    mode: 'petals', // 'petals' | 'jasmine' | 'fireflies' | 'off'
    particles: [],
    animId: null,

    init() {
        this.canvas = document.getElementById('petalCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.spawnInitial(36);
        this.animate();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticle(burstFromTop = false) {
        const w = this.canvas ? this.canvas.width : window.innerWidth;
        const h = this.canvas ? this.canvas.height : window.innerHeight;
        const palette = {
            petals: ['#d43f5d', '#e87a90', '#b82543', '#f4a7b9', '#d4af37'],
            jasmine: ['#fffdf2', '#f7c844', '#f39c12', '#fef9e7', '#e67e22'],
            fireflies: ['#f6e27a', '#ffd700', '#fff5b8']
        };
        const colors = palette[this.mode] || palette.petals;
        return {
            x: Math.random() * w,
            y: burstFromTop ? -20 - Math.random() * 120 : Math.random() * h,
            size: 5 + Math.random() * 8,
            speedY: 0.7 + Math.random() * 1.4,
            speedX: -0.6 + Math.random() * 1.2,
            angle: Math.random() * Math.PI * 2,
            spin: -0.025 + Math.random() * 0.05,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 0.55 + Math.random() * 0.4
        };
    },

    spawnInitial(count) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(false));
        }
    },

    burstCelebration(extraCount = 42) {
        if (this.mode === 'off') {
            this.mode = 'petals';
            updateParticleButtons('petals');
        }
        for (let i = 0; i < extraCount; i++) {
            const p = this.createParticle(true);
            p.speedY = 1.8 + Math.random() * 2.6;
            this.particles.push(p);
        }
        if (this.particles.length > 110) {
            this.particles = this.particles.slice(-110);
        }
    },

    animate() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.mode !== 'off') {
            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                p.y += this.mode === 'fireflies' ? -0.45 * p.speedY : p.speedY;
                p.x += Math.sin(p.angle) * 0.6 + p.speedX;
                p.angle += p.spin;

                if (p.y > this.canvas.height + 25) {
                    p.y = -15;
                    p.x = Math.random() * this.canvas.width;
                } else if (p.y < -25 && this.mode === 'fireflies') {
                    p.y = this.canvas.height + 15;
                    p.x = Math.random() * this.canvas.width;
                }

                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.angle);
                this.ctx.globalAlpha = p.alpha;

                if (this.mode === 'fireflies') {
                    const grad = this.ctx.createRadialGradient(0, 0, 0.5, 0, 0, p.size);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.4, p.color);
                    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
                    this.ctx.fillStyle = grad;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    // Petal / Blossom shape
                    this.ctx.fillStyle = p.color;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -p.size);
                    this.ctx.bezierCurveTo(p.size, -p.size * 0.5, p.size, p.size * 0.8, 0, p.size);
                    this.ctx.bezierCurveTo(-p.size, p.size * 0.8, -p.size, -p.size * 0.5, 0, -p.size);
                    this.ctx.fill();
                }
                this.ctx.restore();
            }
        }
        this.animId = requestAnimationFrame(() => this.animate());
    }
};

function updateParticleButtons(activeMode) {
    document.querySelectorAll('.particle-mode-btn').forEach(btn => {
        const isMatch = btn.getAttribute('data-particle') === activeMode;
        btn.className = isMatch
            ? 'particle-mode-btn px-3 py-1 rounded-full bg-[#6b1d2f] text-amber-100 font-medium transition-all'
            : 'particle-mode-btn px-3 py-1 rounded-full bg-amber-100/70 text-stone-700 hover:bg-amber-200/60 transition-all';
    });
}

const weddingCeremonies = [
    {
        id: 'sagai',
        day: 'day1',
        dateLabel: 'Sunday, Nov 22, 2026',
        time1: 'Lagan - 🕒 5:00 PM',
        time2: 'Dinner - 🕒 7:00 PM',
        title: 'Lagan Sagai Carnival',
        venue: 'Shree Balaji Garden',
        addressCode: 'Gurugram Canal Road, Faridabad, Haryana 121004',
        link: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3511.1972260900934!2d77.3256678748337!3d28.352886275818584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdb83e4006459%3A0xb4909aa3622ba9ef!2sShree%20Balaji%20Garden!5e0!3m2!1sen!2sin!4v1793021606142!5m2!1sen!2sin" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>',
        swatch: '#1f6f50',
        icon: '🌿',
        icsStart: '20261211T123000',
        icsEnd: '20261211T163000'
    },
    {
        id: 'wedding',
        day: 'day2',
        dateLabel: 'Thursday, Nov 26, 2026',
        time1: 'Ghudchadi - 🕒 7:00 PM',
        time2: 'Departure of Barat - 🕒 6:00 PM',
        title: 'Wedding Ceremony',
        venue: 'Jannat Vally',
        addressCode: 'The Savoyy Gate No. 1 Opp. Manav Rachna University, Surajkund Road, Faridabad',
        link: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.9656458055024!2d77.27928987483784!3d28.450451975764622!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce0ab93512a17%3A0x5b76834455e29878!2sJannat%20Valley%20(Wedding%20Venue)!5e0!3m2!1sen!2sin!4v1793021561462!5m2!1sen!2sin" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>',
        swatch: '#1b2a4a',
        icon: '🎶',
        icsStart: '20261211T200000',
        icsEnd: '20261211T235900'
    },
    {
        id: 'reception',
        day: 'day3',
        dateLabel: 'Monday, Nov 30, 2026',
        time1: 'Dinner - 🕒 7:00 PM',
        time2: '',
        title: 'Reception Ceremony',
        venue: 'Four Seasons Banquets',
        addressCode: 'Main Mathura Road, Sikri, Faridabad, Near Golden Galaxy',
        link: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3513.3619061742834!2d77.29133397483092!3d28.28735917585492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cdbc4ea86a4c7%3A0x2d6381f4bf668ec5!2sFour%20Seasons%20By%20TPM!5e0!3m2!1sen!2sin!4v1793021638259!5m2!1sen!2sin" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>',
        swatch: '#e59b14',
        icon: '🌼',
        icsStart: '20261212T103000',
        icsEnd: '20261212T133000'
    }
];

let totalConfirmedGuests = 148;

// =========================================================================
// 4. UI RENDERING & INTERACTION HANDLERS
// =========================================================================
function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'bg-[#2c0a12] text-amber-100 border border-amber-400/60 px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm flex items-center gap-2 transition-all duration-300';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function renderCeremonies(filterDay = 'all') {
    const grid = document.getElementById('ceremoniesGrid');
    if (!grid) return;
    const items = filterDay === 'all'
        ? weddingCeremonies
        : weddingCeremonies.filter(c => c.day === filterDay);

    grid.innerHTML = items.map(c => `
        <div class="ornate-card rounded-2xl p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-[11px] uppercase tracking-widest font-semibold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full">
                ${c.dateLabel}
              </span>
              <span class="text-2xl" aria-hidden="true">${c.icon}</span>
            </div>
            <h3 class="font-serif-luxury text-2xl font-bold text-[#6b1d2f]">${c.title}</h3>
            <p class="text-xs font-semibold text-amber-900 mt-1">📍 ${c.venue}</p>
            <p class="text-xs sm:text-sm text-stone-600 leading-relaxed mt-3">${c.time1}</p>
            <p class="text-xs sm:text-sm text-stone-600 leading-relaxed mt-3">${c.time2}</p>
          </div>

          <div class="mt-5 pt-4 border-t border-amber-500/20 space-y-3">
            <div class="text-xs text-stone-700">
              <span class="w-3.5 h-3.5 rounded-full inline-block border border-amber-600/40" style="background-color: ${c.swatch}"></span>
              <span class="font-medium">Address :</span>
              <span class="text-stone-600">${c.addressCode}</span>
            </div>
            <div id="mapContainer-${c.id}" class="w-auto h-36 rounded-lg overflow-hidden border border-amber-400/30 shadow-sm">
              ${c.link}
            </div>
          </div>
        </div>
      `).join('');

    grid.querySelectorAll('.download-ics-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const eventId = btn.getAttribute('data-ics-id');
            const ev = weddingCeremonies.find(x => x.id === eventId);
            if (!ev) return;
            SoundEngine.playSoftChime();
            downloadEventICS(ev);
        });
    });
}

function downloadEventICS(ev) {
    const couple = document.getElementById('heroCoupleNames')?.textContent.trim() || 'Aarav & Kavya';
    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Royal Wedding Card//EN',
        'BEGIN:VEVENT',
        `SUMMARY:${couple} Wedding - ${ev.title}`,
        `DTSTART:${ev.icsStart}`,
        `DTEND:${ev.icsEnd}`,
        `LOCATION:${ev.venue}, The Oberoi Udaivilas, Udaipur`,
        `DESCRIPTION:${ev.description} (Dress Code: ${ev.dressCode})`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ev.id}-wedding-invite.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Saved "${ev.title}" to your calendar!`);
}
// =========================================================================
// 5. LIVE COUNTDOWN CLOCK
// =========================================================================
function startCountdown() {
    const targetDate = new Date('2026-11-26T19:00:00+05:30').getTime();

    const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, targetDate - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        const dEl = document.getElementById('cdDays');
        const hEl = document.getElementById('cdHours');
        const mEl = document.getElementById('cdMins');
        const sEl = document.getElementById('cdSecs');
        if (dEl) dEl.textContent = String(days).padStart(2, '0');
        if (hEl) hEl.textContent = String(hours).padStart(2, '0');
        if (mEl) mEl.textContent = String(mins).padStart(2, '0');
        if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    };

    updateTimer();
    setInterval(updateTimer, 1000);
}

// =========================================================================
// 6. INITIALIZATION & EVENT LISTENERS
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    ParticleCanvas.init();
    renderCeremonies('all');
    startCountdown();

    // Reveal sections smoothly on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));

    // Envelope Unseal Logic
    const envelopeOverlay = document.getElementById('envelopeOverlay');
    const envelopeBox = document.getElementById('envelopeBox');
    const openEnvelopeBtn = document.getElementById('openEnvelopeBtn');
    const openMutedBtn = document.getElementById('openMutedBtn');
    const replayEnvelopeBtn = document.getElementById('replayEnvelopeBtn');

    function unsealEnvelope(withMusic = true) {
        if (!envelopeBox || !envelopeOverlay) return;
        envelopeBox.classList.add('envelope-open');
        ParticleCanvas.burstCelebration(50);

        if (withMusic) {
            SoundEngine.playEnvelopeUnseal();
            if (SoundEngine.customAudioSrc) {
                SoundEngine.startAmbientMusic();
            } else {
                setTimeout(() => {
                    SoundEngine.startAmbientMusic();
                }, 950);
            }
        } else {
            SoundEngine.stopAmbientMusic();
        }

        setTimeout(() => {
            envelopeOverlay.classList.add('opacity-0', 'pointer-events-none');
        }, 1450);
    }

    if (openEnvelopeBtn) {
        openEnvelopeBtn.addEventListener('click', () => unsealEnvelope(true));
    }
    if (openMutedBtn) {
        openMutedBtn.addEventListener('click', () => unsealEnvelope(false));
    }
    if (replayEnvelopeBtn) {
        replayEnvelopeBtn.addEventListener('click', () => {
            if (!envelopeOverlay || !envelopeBox) return;
            SoundEngine.playSoftChime();
            envelopeBox.classList.remove('envelope-open');
            envelopeOverlay.classList.remove('opacity-0', 'pointer-events-none');
        });
    }

    // Music Bar Controls
    const musicToggleBtn = document.getElementById('musicToggleBtn');
    const melodySelect = document.getElementById('melodySelect');
    if (musicToggleBtn) {
        musicToggleBtn.addEventListener('click', () => {
            SoundEngine.toggleMusic();
        });
    }
    if (melodySelect) {
        melodySelect.addEventListener('change', (e) => {
            SoundEngine.style = e.target.value;
            SoundEngine.stepIndex = 0;
            if (!SoundEngine.isPlaying) {
                SoundEngine.startAmbientMusic();
            } else {
                SoundEngine.playSoftChime();
            }
            showToast(`Soundscape switched to ${e.target.options[e.target.selectedIndex].text}`);
        });
    }

    // Bell Chime & Petal Shower Buttons
    const triggerCelebration = () => {
        SoundEngine.playWeddingBells();
        ParticleCanvas.burstCelebration(55);
        showToast('🔔 Wedding bells ringing & rose petals showering!');
    };

    const bellBurstBtn = document.getElementById('bellBurstBtn');
    const showerBlessingsBtn = document.getElementById('showerBlessingsBtn');
    if (bellBurstBtn) bellBurstBtn.addEventListener('click', triggerCelebration);
    if (showerBlessingsBtn) showerBlessingsBtn.addEventListener('click', triggerCelebration);

    // Particle Mode Buttons
    document.querySelectorAll('.particle-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const newMode = btn.getAttribute('data-particle');
            ParticleCanvas.mode = newMode;
            if (newMode !== 'off') {
                ParticleCanvas.spawnInitial(38);
            }
            SoundEngine.playSoftChime();
            updateParticleButtons(newMode);
        });
    });
    // Ceremony Day Filter Buttons
    document.querySelectorAll('.event-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.getAttribute('data-day');
            SoundEngine.playSoftChime();
            document.querySelectorAll('.event-filter-btn').forEach(b => {
                b.className = b === btn
                    ? 'event-filter-btn px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold bg-[#6b1d2f] text-amber-100 shadow-sm transition-all'
                    : 'event-filter-btn px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold bg-amber-100/80 text-stone-700 hover:bg-amber-200/70 transition-all';
            });
            renderCeremonies(day);
        });
    });
    // Copy Venue Address Button
    const copyVenueAddressBtn = document.getElementById('copyVenueAddressBtn');
    if (copyVenueAddressBtn) {
        copyVenueAddressBtn.addEventListener('click', () => {
            const textToCopy = 'The Oberoi Udaivilas, Haridasji Ki Magri, Mulla Talai, Udaipur, Rajasthan 313001 • Royal Wedding Concierge: +91 294 243 3300';
            SoundEngine.playSoftChime();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).catch(() => { });
            } else {
                const temp = document.createElement('textarea');
                temp.value = textToCopy;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                temp.remove();
            }
            showToast('Palace address & concierge details copied!');
        });
    }



    // Personalize Card Modal
    const customizeModal = document.getElementById('customizeModal');
    const openCustomizeBtn = document.getElementById('openCustomizeBtn');
    const closeCustomizeBtn = document.getElementById('closeCustomizeBtn');
    const cancelCustomizeBtn = document.getElementById('cancelCustomizeBtn');
    const customizeCardForm = document.getElementById('customizeCardForm');

    const closeModal = () => {
        if (customizeModal) {
            customizeModal.classList.add('hidden');
            customizeModal.classList.remove('flex');
        }
    };

    if (openCustomizeBtn && customizeModal) {
        openCustomizeBtn.addEventListener('click', () => {
            SoundEngine.playSoftChime();
            customizeModal.classList.remove('hidden');
            customizeModal.classList.add('flex');
        });
    }
    if (closeCustomizeBtn) closeCustomizeBtn.addEventListener('click', closeModal);
    if (cancelCustomizeBtn) cancelCustomizeBtn.addEventListener('click', closeModal);

    if (customizeCardForm) {
        customizeCardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1 = document.getElementById('customPartner1').value.trim() || 'Aarav';
            const p2 = document.getElementById('customPartner2').value.trim() || 'Kavya';
            const dateStr = document.getElementById('customDateText').value.trim();
            const timeStr = document.getElementById('customTimeText').value.trim();
            const venueStr = document.getElementById('customVenueText').value.trim();
            const hostStr = document.getElementById('customHostText').value.trim();

            const fullNames = `${p1} & ${p2}`;
            const mono = `${p1.charAt(0).toUpperCase()}&${p2.charAt(0).toUpperCase()}`;

            document.getElementById('heroCoupleNames').textContent = fullNames;
            document.getElementById('envCoupleNames').textContent = fullNames;
            document.getElementById('navCoupleTitle').textContent = fullNames;
            document.getElementById('footerMonogram').textContent = fullNames;
            document.getElementById('navMonogram').textContent = mono;

            document.getElementById('heroDateDisplay').textContent = dateStr;
            document.getElementById('heroTimeDisplay').textContent = timeStr;
            document.getElementById('heroVenueBanner').textContent = venueStr;
            document.getElementById('venueSectionHeading').textContent = venueStr;
            document.getElementById('envDateVenue').textContent = `${dateStr} • ${venueStr}`;
            document.getElementById('cardHostLine').textContent = hostStr;

            closeModal();
            SoundEngine.playWeddingBells();
            ParticleCanvas.burstCelebration(45);
            showToast(`Invitation personalized for ${fullNames}!`);
        });
    }
});
