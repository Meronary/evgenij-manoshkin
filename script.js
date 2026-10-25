// 1. МОБИЛЬНОЕ БУРГЕР-МЕНЮ
const burgerBtn = document.getElementById('burger-btn');
const navMenu = document.getElementById('nav-menu');

if (burgerBtn && navMenu) {
    burgerBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
        });
    });
}

// 2. АУДИОПЛЕЕР И ИНТЕРАКТИВНЫЕ ЭЛЕМЕНТЫ АЛЬБОМА
const trackRows = document.querySelectorAll('.track-row');
const audio = document.getElementById('audio-element');
const albumCard = document.getElementById('album-card');
const nowPlayingLabel = document.getElementById('now-playing-label');
const playerTitle = document.getElementById('player-title');
const masterPlayBtn = document.getElementById('master-play');
const heroPlayBtn = document.getElementById('hero-play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');

const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

let currentTrackIndex = 0;
let isPlaying = false;
let isDraggingSlider = false;

if (volumeSlider && audio) {
    audio.volume = parseFloat(volumeSlider.value);
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = parseFloat(e.target.value);
    });
}

function formatTime(sec) {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    const whole = Math.max(0, Math.floor(sec));
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Предзагрузка длительности всех 14 треков
trackRows.forEach((row, index) => {
    const src = row.getAttribute('data-src');
    const timeEl = row.querySelector('.track-time');
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = src;

    probe.addEventListener('loadedmetadata', () => {
        if (probe.duration && isFinite(probe.duration)) {
            timeEl.textContent = formatTime(probe.duration);
            if (index === 0) totalTimeEl.textContent = formatTime(probe.duration);
        }
    });
});

function resetTrackButtons() {
    trackRows.forEach((r) => {
        r.classList.remove('playing');
        const btn = r.querySelector('.track-play-btn');
        if (btn) btn.innerHTML = ICON_PLAY;
    });
}

function syncHeroButton() {
    if (!heroPlayBtn) return;
    if (isPlaying) {
        heroPlayBtn.innerHTML = `${ICON_PAUSE}<span>Пауза</span>`;
    } else {
        heroPlayBtn.innerHTML = `${ICON_PLAY}<span>Включить альбом</span>`;
    }
}

function updateProgressUI(currentSec, durationSec) {
    const safeDur = durationSec > 0 ? durationSec : 1;
    const percent = Math.min(100, Math.max(0, (currentSec / safeDur) * 100));

    if (!isDraggingSlider) seekSlider.value = percent;
    currentTimeEl.textContent = formatTime(currentSec);
    totalTimeEl.textContent = formatTime(safeDur);

    const activeRow = trackRows[currentTrackIndex];
    if (activeRow) {
        activeRow.querySelector('.track-progress').style.width = `${percent}%`;
        activeRow.querySelector('.track-time').textContent = formatTime(safeDur);
    }
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    masterPlayBtn.innerHTML = ICON_PLAY;
    if (albumCard) albumCard.classList.remove('is-playing');
    resetTrackButtons();
    syncHeroButton();
}

function playTrack(index, seekRatio = null) {
    const row = trackRows[index];
    if (!row) return;

    const title = row.getAttribute('data-title');
    const src = row.getAttribute('data-src');
    const num = row.querySelector('.track-num').textContent;

    if (currentTrackIndex !== index) {
        trackRows.forEach((r) => {
            r.querySelector('.track-progress').style.width = '0%';
        });
        currentTrackIndex = index;
    }

    resetTrackButtons();
    row.classList.add('playing');
    row.querySelector('.track-play-btn').innerHTML = ICON_PAUSE;

    playerTitle.textContent = `${num}. ${title}`;
    nowPlayingLabel.textContent = 'Сейчас играет:';
    masterPlayBtn.innerHTML = ICON_PAUSE;
    isPlaying = true;
    if (albumCard) albumCard.classList.add('is-playing');
    syncHeroButton();

    if (audio.dataset.loadedSrc !== src) {
        audio.src = src;
        audio.dataset.loadedSrc = src;
    }

    if (seekRatio !== null && audio.duration && isFinite(audio.duration)) {
        audio.currentTime = seekRatio * audio.duration;
    }

    audio.play().catch(() => {
        pauseTrack();
    });
}

function seekToRatio(ratio) {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (audio.duration && isFinite(audio.duration)) {
        audio.currentTime = clamped * audio.duration;
        updateProgressUI(audio.currentTime, audio.duration);
    }
}

trackRows.forEach((row, idx) => {
    const waveBar = row.querySelector('.track-wave');

    waveBar.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = waveBar.getBoundingClientRect();
        const clickRatio = (e.clientX - rect.left) / rect.width;

        if (currentTrackIndex !== idx || !isPlaying) {
            playTrack(idx, clickRatio);
        } else {
            seekToRatio(clickRatio);
        }
    });

    row.addEventListener('click', () => {
        if (currentTrackIndex === idx && isPlaying) {
            pauseTrack();
        } else {
            playTrack(idx);
        }
    });
});

// Кнопка «Включить альбом» в первом экране
if (heroPlayBtn) {
    heroPlayBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack(currentTrackIndex);
        }
    });
}

audio.addEventListener('loadedmetadata', () => {
    if (audio.duration && isFinite(audio.duration)) {
        totalTimeEl.textContent = formatTime(audio.duration);
        trackRows[currentTrackIndex].querySelector('.track-time').textContent = formatTime(audio.duration);
    }
});

audio.addEventListener('timeupdate', () => {
    if (!audio.duration || !isFinite(audio.duration)) return;
    updateProgressUI(audio.currentTime, audio.duration);
});

audio.addEventListener('ended', () => {
    if (trackRows[currentTrackIndex]) {
        trackRows[currentTrackIndex].querySelector('.track-progress').style.width = '0%';
    }
    const nextIndex = (currentTrackIndex + 1) % trackRows.length;
    playTrack(nextIndex);
});

seekSlider.addEventListener('mousedown', () => { isDraggingSlider = true; });
seekSlider.addEventListener('touchstart', () => { isDraggingSlider = true; }, { passive: true });

seekSlider.addEventListener('input', (e) => {
    seekToRatio(parseFloat(e.target.value) / 100);
});

seekSlider.addEventListener('change', () => { isDraggingSlider = false; });
window.addEventListener('mouseup', () => { isDraggingSlider = false; });

masterPlayBtn.addEventListener('click', () => {
    if (isPlaying) pauseTrack();
    else playTrack(currentTrackIndex);
});

prevBtn.addEventListener('click', () => {
    playTrack((currentTrackIndex - 1 + trackRows.length) % trackRows.length);
});

nextBtn.addEventListener('click', () => {
    playTrack((currentTrackIndex + 1) % trackRows.length);
});

// 3. КОПИРОВАНИЕ ССЫЛКИ В БЛОКЕ ВИЗИТКИ
const copyLinkBtn = document.getElementById('copy-link-btn');
if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            const originalText = copyLinkBtn.textContent;
            copyLinkBtn.textContent = 'Ссылка скопирована ✓';
            setTimeout(() => {
                copyLinkBtn.textContent = originalText;
            }, 2500);
        });
    });
}

// 4. ПЛАВНОЕ ПОЯВЛЕНИЕ СЕКЦИЙ ПРИ ПРОКРУТКЕ
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    },
    { threshold: 0.12 }
);

revealElements.forEach((el) => revealObserver.observe(el));