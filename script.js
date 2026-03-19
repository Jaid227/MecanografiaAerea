document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Juego iniciado con penalización por fallo de tecla...');
    
    // ===== ELEMENTOS DEL DOM =====
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreSpan = document.getElementById('scoreDisplay');
    const streakSpan = document.getElementById('streakDisplay');
    const difficultyDisplay = document.getElementById('difficultyDisplay');
    const lettersLeftSpan = document.getElementById('lettersLeftDisplay');
    const speedInfoSpan = document.querySelector('#speedInfo span');
    const hiddenInput = document.getElementById('hiddenInput');
    
    // Elementos de la pantalla de resultados
    const resultTitle = document.getElementById('resultTitle');
    const finalScore = document.getElementById('finalScore');
    const finalDifficulty = document.getElementById('finalDifficulty');
    const finalLetters = document.getElementById('finalLetters');
    const finalStreak = document.getElementById('finalStreak');
    const resultMenuBtn = document.getElementById('resultMenuBtn');
    const resultReplayBtn = document.getElementById('resultReplayBtn');
    
    // Botones y controles
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const startGameBtn = document.getElementById('startGameBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    const resetGameBtn = document.getElementById('resetGameBtn');
    const letterSlider = document.getElementById('letterCountSlider');
    const letterCountDisplay = document.getElementById('letterCountDisplay');
    
    // ===== CONFIGURACIÓN DE DIFICULTADES =====
    const difficulties = {
        easy: {
            name: 'Fácil',
            gravity: 0.01,
            parachuteGravity: 0.005,
            initialSpeed: 0.1,
            spawnRate: 200,
            swayAmplitude: .5,
            swaySpeed: 0.005,
            color: '#28a745',
            speedText: 'Lenta'
        },
        medium: {
            name: 'Medio',
            gravity: 0.02,
            parachuteGravity: 0.04,
            initialSpeed: 1.8,
            spawnRate: 100,
            swayAmplitude: 1.2,
            swaySpeed: 0.025,
            color: '#f39c12',
            speedText: 'Moderada'
        },
        hard: {
            name: 'Avanzado',
            gravity: 0.02,
            parachuteGravity: 0.05,
            initialSpeed: 1.8,
            spawnRate: 50,
            swayAmplitude: 1.5,
            swaySpeed: 0.04,
            color: '#e74c3c',
            speedText: 'Rápida'
        }
    };
    
    // ===== VARIABLES DEL JUEGO =====
    let currentDifficulty = 'easy';
    let letters = [];
    let score = 0;
    let streak = 0;
    let maxStreak = 0;
    let totalLettersToSpawn = 100;
    let lettersSpawned = 0;
    let animationId = null;
    let frameCount = 0;
    let gameActive = false;
    let gameFinished = false;
    
    // Variables para efectos visuales
    let floatingTexts = [];
    let comboBreakEffect = {
        active: false,
        timer: 0,
        streakLost: 0
    };
    
    // Constantes
    const GROUND_Y = canvas.height - 70;
    const BASE_POINTS = 10;
    const PENALTY_LAND = 200;        // Penalización por caer al suelo sin paracaídas
    const PENALTY_WRONG_KEY = 50;    // Penalización por teclear letra incorrecta
    const POSSIBLE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // ===== FUNCIÓN PARA CALCULAR PUNTOS CON BONO EXPONENCIAL =====
    function calculateBonusPoints() {
    if (streak <= 1) return 0;
    
    let bonus = Math.pow(2, streak - 2);
    
    // PONER LÍMITE MÁXIMO AQUÍ
    const MAX_BONUS = 9990; // Cambia este número
    
    if (bonus > MAX_BONUS) {
        return MAX_BONUS;
    }
    
    return bonus;
}
    
    // ===== FUNCIÓN PARA TEXTO FLOTANTE =====
    function addFloatingText(text, x, y, color, fontSize = 24) {
        floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            fontSize: fontSize,
            life: 60 // Duración en frames
        });
    }
    
    // ===== ACTUALIZAR DISPLAY DE RACHA =====
    function updateStreak() {
        streakSpan.textContent = streak;
        if (streak > maxStreak) {
            maxStreak = streak;
        }
    }
    
    // ===== FUNCIONES PRINCIPALES =====
    
    // Actualizar contador de letras en el slider
    letterSlider.addEventListener('input', (e) => {
        totalLettersToSpawn = parseInt(e.target.value);
        letterCountDisplay.textContent = totalLettersToSpawn;
    });
    
    // Seleccionar dificultad
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyBtns.forEach(b => {
                b.style.transform = 'scale(1)';
                b.style.border = '3px solid transparent';
            });
            btn.style.transform = 'scale(1.05)';
            btn.style.border = '5px solid white';
            currentDifficulty = btn.dataset.difficulty;
            console.log('📊 Dificultad seleccionada:', currentDifficulty);
        });
    });
    
    // Iniciar juego
    startGameBtn.addEventListener('click', () => {
        console.log('🚀 Iniciando juego con', totalLettersToSpawn, 'letras...');
        startScreen.style.display = 'none';
        gameScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        gameActive = true;
        gameFinished = false;
        resetGame();
        updateDifficultyDisplay();
        resizeCanvas();
        
        if (!animationId) {
            gameLoop();
        }
        
        setTimeout(() => {
            hiddenInput.focus();
        }, 300);
    });
    
    // Volver al menú
    backToMenuBtn.addEventListener('click', () => {
        console.log('🏠 Volviendo al menú principal...');
        gameScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        startScreen.style.display = 'block';
        gameActive = false;
        gameFinished = false;
        letters = [];
    });
    
    // Reiniciar juego
    resetGameBtn.addEventListener('click', () => {
        console.log('🔄 Reiniciando juego...');
        gameActive = true;
        gameFinished = false;
        resetGame();
        hiddenInput.focus();
    });
    
    // ===== MOSTRAR PANTALLA DE RESULTADOS =====
    function showResultScreen(isVictory) {
        gameActive = false;
        gameFinished = true;
        
        if (isVictory) {
            resultTitle.textContent = '🏆 ¡VICTORIA! 🏆';
            resultTitle.style.color = '#ffd700';
        } else {
            resultTitle.textContent = '💔 ¡GAME OVER! 💔';
            resultTitle.style.color = '#ff4757';
        }
        
        finalScore.textContent = score;
        finalDifficulty.textContent = difficulties[currentDifficulty].name;
        finalLetters.textContent = totalLettersToSpawn;
        finalStreak.textContent = maxStreak;
        
        gameScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    }
    
    // Botones de la pantalla de resultados
    resultMenuBtn.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        startScreen.style.display = 'block';
    });
    
    resultReplayBtn.addEventListener('click', () => {
        resultScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        gameActive = true;
        gameFinished = false;
        resetGame();
        hiddenInput.focus();
    });
    
    // Actualizar display de dificultad
    function updateDifficultyDisplay() {
        const diff = difficulties[currentDifficulty];
        difficultyDisplay.textContent = diff.name;
        difficultyDisplay.style.color = diff.color;
        if (speedInfoSpan) {
            speedInfoSpan.textContent = diff.speedText;
            speedInfoSpan.style.color = diff.color;
        }
    }
    
    // Resetear juego
    function resetGame() {
        letters = [];
        score = 100;
        streak = 0;
        maxStreak = 0;
        lettersSpawned = 0;
        frameCount = 0;
        floatingTexts = [];
        comboBreakEffect.active = false;
        updateScore();
        updateStreak();
        updateLettersLeft();
    }
    
    // Actualizar puntuación
    function updateScore() {
        if (scoreSpan) {
            scoreSpan.textContent = score;
        }
        
        if (gameActive && !gameFinished && score <= 0) {
            console.log('💔 Game Over - Puntuación negativa');
            showResultScreen(false);
        }
    }
    
    // Actualizar letras restantes
    function updateLettersLeft() {
        const left = Math.max(0, totalLettersToSpawn - lettersSpawned);
        lettersLeftSpan.textContent = left;
        
        if (gameActive && !gameFinished && left === 0 && letters.length === 0) {
            console.log('🏆 Victoria - Todas las letras salvadas');
            showResultScreen(true);
        }
    }
    
    // Generar letra aleatoria
    function getRandomLetter() {
        return POSSIBLE_LETTERS.charAt(Math.floor(Math.random() * POSSIBLE_LETTERS.length));
    }
    
    // Crear nueva letra
    function createLetter() {
        const diff = difficulties[currentDifficulty];
        return {
            char: getRandomLetter(),
            x: Math.random() * (canvas.width - 100) + 50,
            y: 20,
            vy: diff.initialSpeed + (Math.random() * 1.0),
            vx: 0,
            swayOffset: Math.random() * Math.PI * 2,
            hasParachute: false,
            width: 35,
            height: 35
        };
    }
    
    // Ajustar tamaño del canvas
    function resizeCanvas() {
        const container = canvas.parentElement;
        if (container) {
            canvas.width = Math.min(1000, container.clientWidth - 30);
            canvas.height = Math.min(600, window.innerHeight - 250);
        }
    }
    
    // ===== DIBUJAR PAISAJE =====
    function drawLandscape() {
        const w = canvas.width;
        const h = canvas.height;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.6, '#98D8E8');
        skyGradient.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        ctx.beginPath();
        ctx.arc(w - 100, 80, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFA500';
        ctx.shadowBlur = 30;
        ctx.fill();
        
        ctx.shadowBlur = 20;
        for (let i = 0; i < 12; i++) {
            let angle = (i / 12) * Math.PI * 2;
            let x1 = w - 100 + Math.cos(angle) * 60;
            let y1 = 80 + Math.sin(angle) * 60;
            let x2 = w - 100 + Math.cos(angle) * 90;
            let y2 = 80 + Math.sin(angle) * 90;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        ctx.beginPath();
        ctx.arc(150, 100, 30, 0, Math.PI * 2);
        ctx.arc(180, 80, 25, 0, Math.PI * 2);
        ctx.arc(210, 100, 30, 0, Math.PI * 2);
        ctx.arc(180, 120, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(400, 150, 25, 0, Math.PI * 2);
        ctx.arc(430, 130, 30, 0, Math.PI * 2);
        ctx.arc(460, 150, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.moveTo(0, h - 100);
        ctx.lineTo(200, h - 250);
        ctx.lineTo(400, h - 180);
        ctx.lineTo(600, h - 280);
        ctx.lineTo(800, h - 200);
        ctx.lineTo(w, h - 250);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
        
        ctx.fillStyle = '#34495E';
        ctx.beginPath();
        ctx.moveTo(0, h - 50);
        ctx.lineTo(150, h - 180);
        ctx.lineTo(300, h - 120);
        ctx.lineTo(450, h - 200);
        ctx.lineTo(600, h - 150);
        ctx.lineTo(750, h - 220);
        ctx.lineTo(w, h - 180);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
        
        const riverGradient = ctx.createLinearGradient(0, h - 100, 0, h);
        riverGradient.addColorStop(0, '#4A90E2');
        riverGradient.addColorStop(0.5, '#357ABD');
        riverGradient.addColorStop(1, '#2C5F8A');
        
        ctx.fillStyle = riverGradient;
        ctx.beginPath();
        ctx.moveTo(0, h - 40);
        ctx.lineTo(200, h - 60);
        ctx.lineTo(400, h - 45);
        ctx.lineTo(600, h - 65);
        ctx.lineTo(800, h - 50);
        ctx.lineTo(w, h - 70);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
        
        ctx.shadowColor = '#87CEEB';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h - 45);
        ctx.lineTo(200, h - 65);
        ctx.lineTo(400, h - 50);
        ctx.lineTo(600, h - 70);
        ctx.lineTo(800, h - 55);
        ctx.lineTo(w, h - 75);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }
    
    // ===== ANIMACIÓN DEL JUEGO =====
    function gameLoop() {
        if (!gameActive) {
            animationId = requestAnimationFrame(gameLoop);
            return;
        }
        
        try {
            drawLandscape();
            
            const diff = difficulties[currentDifficulty];
            
            // ===== EFECTO DE COMBO ROTO =====
            if (comboBreakEffect.active) {
                comboBreakEffect.timer--;
                
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.font = 'bold 60px Arial';
                ctx.fillStyle = '#ff4757';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 30;
                ctx.textAlign = 'center';
                ctx.fillText('💔 ¡COMBO ROTO! 💔', canvas.width / 2, canvas.height / 2 - 50);
                
                ctx.font = 'bold 30px Arial';
                ctx.fillStyle = '#ff6b81';
                ctx.fillText('Perdiste tu racha de', canvas.width / 2, canvas.height / 2 + 20);
                ctx.font = 'bold 40px Arial';
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`${comboBreakEffect.streakLost} aciertos`, canvas.width / 2, canvas.height / 2 + 70);
                
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#ffaa00';
                ctx.fillText('¡Vuelve a intentarlo!', canvas.width / 2, canvas.height / 2 + 130);
                ctx.restore();
                
                if (comboBreakEffect.timer <= 0) {
                    comboBreakEffect.active = false;
                }
            }
            
            // ===== INDICADOR DE RACHA ACTIVA =====
            if (streak > 2 && !comboBreakEffect.active) {
                ctx.save();
                ctx.font = 'bold 28px Arial';
                ctx.fillStyle = streak > 5 ? '#ff00ff' : '#ffaa00';
                ctx.shadowColor = streak > 5 ? '#ff00ff' : '#ffaa00';
                ctx.shadowBlur = 20;
                ctx.textAlign = 'center';
                
                let mensaje = `🔥 ¡RACHA ${streak}! 🔥`;
                if (streak > 10) mensaje = `⚡ ¡RACHA IMPARABLE ${streak}! ⚡`;
                if (streak > 15) mensaje = `🌟 ¡RACHA LEGENDARIA ${streak}! 🌟`;
                
                ctx.fillText(mensaje, canvas.width / 2, 60);
                ctx.restore();
            }
            
            // ===== CAMBIAR COLOR DEL BORDE SEGÚN RACHA =====
            let borderColor = diff.color;
            let shadowIntensity = 20;
            
            if (streak > 15) {
                borderColor = '#ff00ff';
                shadowIntensity = 50;
            } else if (streak > 10) {
                borderColor = '#ffaa00';
                shadowIntensity = 40;
            } else if (streak > 5) {
                borderColor = '#ff6b81';
                shadowIntensity = 30;
            } else if (streak > 2) {
                borderColor = '#ffd700';
                shadowIntensity = 25;
            }
            
            canvas.style.borderColor = borderColor;
            canvas.style.boxShadow = `0 0 ${shadowIntensity}px ${borderColor}`;
            
            // ===== GENERAR NUEVAS LETRAS =====
            frameCount++;
            if (frameCount % diff.spawnRate === 0 && lettersSpawned < totalLettersToSpawn && gameActive && !gameFinished) {
                if (letters.length < 40) {
                    letters.push(createLetter());
                    lettersSpawned++;
                    updateLettersLeft();
                }
            }
            
            // ===== ACTUALIZAR TEXTOS FLOTANTES =====
            for (let i = floatingTexts.length - 1; i >= 0; i--) {
                const text = floatingTexts[i];
                text.life--;
                text.y -= 0.5;
                
                ctx.save();
                ctx.font = `bold ${text.fontSize}px Arial`;
                ctx.fillStyle = text.color;
                ctx.shadowColor = 'white';
                ctx.shadowBlur = 10;
                ctx.textAlign = 'center';
                ctx.globalAlpha = text.life / 60;
                ctx.fillText(text.text, text.x, text.y);
                ctx.restore();
                
                if (text.life <= 0) {
                    floatingTexts.splice(i, 1);
                }
            }
            
            // ===== ACTUALIZAR Y DIBUJAR LETRAS =====
            for (let i = letters.length - 1; i >= 0; i--) {
                const letter = letters[i];
                
                if (letter.hasParachute) {
                    letter.vy += diff.parachuteGravity;
                    letter.vx = Math.sin(frameCount * diff.swaySpeed + letter.swayOffset) * diff.swayAmplitude;
                    letter.x += letter.vx;
                    
                    if (letter.vy > 2.2) letter.vy = 2.2;
                    
                    if (letter.x < 30) {
                        letter.x = 30;
                        letter.swayOffset += Math.PI;
                    }
                    if (letter.x > canvas.width - 30) {
                        letter.x = canvas.width - 30;
                        letter.swayOffset += Math.PI;
                    }
                } else {
                    letter.vy += diff.gravity;
                }
                
                letter.y += letter.vy;
                
                // ===== COMPROBAR SI LLEGÓ AL SUELO =====
                if (letter.y >= GROUND_Y) {
                    if (letter.hasParachute) {
                        const bonus = calculateBonusPoints();
                        const pointsEarned = BASE_POINTS + bonus;
                        score += pointsEarned;
                        streak++;
                        
                        addFloatingText(`+${pointsEarned}`, letter.x, letter.y - 50, '#00ff88', 28);
                        if (bonus > 0) {
                            addFloatingText(`Bono: +${bonus}`, letter.x, letter.y - 80, '#ffd700', 18);
                        }
                    } else {
                        score -= PENALTY_LAND;
                        
                        if (streak > 2) {
                            comboBreakEffect.active = true;
                            comboBreakEffect.timer = 90;
                            comboBreakEffect.streakLost = streak;
                        }
                        
                        addFloatingText(`-${PENALTY_LAND}`, letter.x, letter.y - 50, '#ff4757', 28);
                        addFloatingText('❌ FALLO', letter.x, letter.y - 80, '#ff6b81', 20);
                        
                        streak = 0;
                    }
                    letters.splice(i, 1);
                    updateScore();
                    updateStreak();
                    updateLettersLeft();
                    continue;
                }
                
                // ===== DIBUJAR LETRA =====
                ctx.save();
                
                ctx.shadowColor = letter.hasParachute ? '#ffd700' : diff.color;
                ctx.shadowBlur = letter.hasParachute ? 20 : 10;
                
                ctx.beginPath();
                ctx.arc(letter.x, letter.y, 22, 0, Math.PI * 2);
                ctx.fillStyle = letter.hasParachute ? '#fff8e7' : 'white';
                ctx.fill();
                ctx.strokeStyle = letter.hasParachute ? '#ffd700' : diff.color;
                ctx.lineWidth = 3;
                ctx.stroke();
                
                if (letter.hasParachute) {
                    ctx.fillStyle = '#ff6b81';
                    ctx.shadowColor = '#ff6b81';
                    
                    ctx.beginPath();
                    ctx.arc(letter.x, letter.y - 35, 20, 0, Math.PI, true);
                    ctx.fill();
                    
                    ctx.fillStyle = '#ff4757';
                    ctx.beginPath();
                    ctx.arc(letter.x, letter.y - 50, 9, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 2.5;
                    ctx.shadowBlur = 5;
                    
                    for (let j = -1; j <= 1; j += 2) {
                        ctx.moveTo(letter.x + (j * 14), letter.y - 30);
                        ctx.lineTo(letter.x, letter.y - 18);
                    }
                    ctx.stroke();
                }
                
                ctx.shadowBlur = 0;
                ctx.font = 'bold 32px Arial';
                ctx.fillStyle = '#2c3e50';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(letter.char, letter.x, letter.y);
                
                ctx.restore();
            }
            
            // ===== DIBUJAR SUELO =====
            ctx.fillStyle = '#2d5a27';
            ctx.fillRect(0, GROUND_Y - 5, canvas.width, 10);
            ctx.fillStyle = '#1e3c1e';
            ctx.fillRect(0, GROUND_Y, canvas.width, 15);
            
            ctx.fillStyle = '#2ecc71';
            for (let i = 0; i < canvas.width; i += 25) {
                ctx.beginPath();
                ctx.moveTo(i, GROUND_Y - 5);
                ctx.lineTo(i + 20, GROUND_Y - 25);
                ctx.lineTo(i - 20, GROUND_Y - 25);
                ctx.fill();
            }
            
        } catch (error) {
            console.error('Error en gameLoop:', error);
        }
        
        animationId = requestAnimationFrame(gameLoop);
    }
    
    // ===== MANEJAR TECLAS (CON PENALIZACIÓN POR FALLO) =====
    function handleKeyPress(event) {
        if (!gameActive || gameFinished) return;
        
        event.preventDefault();
        
        let key = event.key.toUpperCase();
        
        if (!POSSIBLE_LETTERS.includes(key)) return;
        
        // Buscar si la letra presionada está en alguna letra que cae
        let letterFound = false;
        
        letters.forEach(letter => {
            if (letter.char === key && !letter.hasParachute) {
                letter.hasParachute = true;
                letter.vy = letter.vy * 0.25;
                letterFound = true;
            }
        });
        
        if (letterFound) {
            // ACIERTO - La letra estaba en pantalla
            addFloatingText(`✓ ${key}`, canvas.width / 2, canvas.height / 2, '#00ff88', 48);
            console.log('✅ Acierto:', key);
        } else {
            // FALLO DE TECLA - La letra NO estaba en pantalla
            score -= PENALTY_WRONG_KEY;
            
            // Guardar racha antes de reiniciarla para el efecto
            if (streak > 2) {
                comboBreakEffect.active = true;
                comboBreakEffect.timer = 90;
                comboBreakEffect.streakLost = streak;
            }
            
            streak = 0; // Reiniciar combo
            
            // Mostrar feedback visual de fallo
            addFloatingText(`❌ ${key}`, canvas.width / 2, canvas.height / 2 - 30, '#ff4757', 48);
            addFloatingText(`-${PENALTY_WRONG_KEY}`, canvas.width / 2, canvas.height / 2 + 30, '#ff6b81', 36);
            
            // Hacer que el canvas parpadee en rojo
            canvas.style.transition = 'background-color 0.1s';
            canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            setTimeout(() => {
                canvas.style.backgroundColor = '';
                canvas.style.transition = '';
            }, 100);
            
            updateScore();
            updateStreak();
            
            console.log('❌ Fallo de tecla:', key, 'Penalización:', PENALTY_WRONG_KEY);
        }
        
        hiddenInput.value = '';
    }
    
    // Event listeners
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        if (key.length === 1 && /[a-zA-Z]/i.test(key) && gameActive && !gameFinished) {
            event.preventDefault();
            handleKeyPress(event);
        }
    });
    
    hiddenInput.addEventListener('keydown', (event) => {
        event.stopPropagation();
        handleKeyPress(event);
    });
    
    hiddenInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (gameActive && !gameFinished && document.visibilityState === 'visible') {
                hiddenInput.focus();
            }
        }, 100);
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameActive && !gameFinished) {
            hiddenInput.focus();
        }
    });
    
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    gameLoop();
    
    startScreen.style.display = 'block';
    gameScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
});