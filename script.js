
        // --- Security Deterrence: Disable Common Developer Shortcuts ---
        document.addEventListener('keydown', function (e) {
            // F12 key check (Key Code 123)
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                return;
            }
            
            // Checks for Ctrl/Cmd (metaKey) + Shift + I (Developer Tools)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
                e.preventDefault();
                return;
            }
            
            // Checks for Ctrl/Cmd (metaKey) + U (View Page Source)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
                return;
            }
        });

        // --- NEW AUDIO LOGIC FOR SOFT POP ON ANY CLICK ---
        let popSynth = null;
        let isAudioReady = false;
        
        /**
         * Initializes the Tone.js audio engine (must be triggered by a user gesture).
         * Creates and configures a PluckSynth for a soft "pop" sound.
         */
        async function initializeAudio() {
            if (isAudioReady) return;

            try {
                await Tone.start();
                console.log("AudioContext started.");

                // PluckSynth is ideal for soft, non-tonal percussive sounds
                popSynth = new Tone.PluckSynth({
                    attackNoise: 0.8, // More noise for a percussive attack
                    dampening: 2000,
                    resonance: 0.9
                }).toDestination();

                isAudioReady = true;
            } catch (error) {
                console.error("Failed to start AudioContext:", error);
            }
        }

        /**
         * Plays the soft pop sound effect.
         */
        function playPopSound() {
            if (isAudioReady && popSynth) {
                // Using a note (C5) and a short duration (16n) ensures Tone.js gets all needed scheduling arguments.
                popSynth.triggerAttackRelease("C5", "16n"); 
            }
        }

        // --- Easter Egg Logic: Circle Gesture Detection (彩蛋) ---
        let isDrawing = false;
        let gesturePoints = [];
        const MIN_PATH_LENGTH = 300; 
        const MIN_RADIUS = 50;       
        const MAX_LOOP_CLOSURE = 30; 

        /**
         * Calculates the Euclidean distance between two points.
         */
        function distance(p1, p2) {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        }

        /**
         * Checks if the collected points form a rough circle gesture.
         */
        function detectCircleGesture() {
            if (gesturePoints.length < 5) return false;

            const start = gesturePoints[0];
            const end = gesturePoints[gesturePoints.length - 1];

            // 1. Check for loop closure (start point is close to end point)
            if (distance(start, end) > MAX_LOOP_CLOSURE) {
                return false;
            }

            // 2. Check path length (ensure it wasn't just a quick click)
            let pathLength = 0;
            let maxX = start.x, minX = start.x, maxY = start.y, minY = start.y;
            for (let i = 1; i < gesturePoints.length; i++) {
                pathLength += distance(gesturePoints[i - 1], gesturePoints[i]);
                maxX = Math.max(maxX, gesturePoints[i].x);
                minX = Math.min(minX, gesturePoints[i].x);
                maxY = Math.max(maxY, gesturePoints[i].y);
                minY = Math.min(minY, gesturePoints[i].y);
            }

            if (pathLength < MIN_PATH_LENGTH) {
                return false;
            }
            
            // 3. Check for minimum drawing size (approximate radius)
            const width = maxX - minX;
            const height = maxY - minY;
            if (width < MIN_RADIUS * 2 || height < MIN_RADIUS * 2) {
                return false;
            }

            // 4. Basic "circularity" check: Path length should be roughly pi * diameter (or circumference)
            const diameter = (width + height) / 2;
            const theoreticalCircumference = Math.PI * diameter;

            // Check if the actual path length is within a reasonable range of the circumference
            if (pathLength > theoreticalCircumference * 1.5 || pathLength < theoreticalCircumference * 0.7) {
                return false;
            }

            // If all checks pass, it's a circle!
            return true;
        }

        function showEasterEggModal() {
            const modal = document.getElementById('easter-egg-modal');
            const content = document.getElementById('modal-content');
            
            modal.classList.add('modal-show');
            // Remove scale-90 and opacity-0 from content via class list to trigger transition
            content.classList.remove('scale-90', 'opacity-0'); 
        }

        function closeEasterEggModal(event) {
            const modal = document.getElementById('easter-egg-modal');
            const content = document.getElementById('modal-content');
            
            // Check if event is passed and if the click was directly on the backdrop
            if (event && event.target !== modal) {
                // If the target is not the modal itself (i.e., it's the content inside), do nothing.
                return;
            }

            modal.classList.remove('modal-show');
            // Re-apply initial transition states for next show
            content.classList.add('scale-90', 'opacity-0'); 
        }
        
        // Expose function globally so it can be called from the button
        window.closeEasterEggModal = closeEasterEggModal; 

        // Gesture Event Listeners
        document.addEventListener('mousedown', (e) => {
            isDrawing = true;
            gesturePoints = [{ x: e.clientX, y: e.clientY }];
        });

        document.addEventListener('mousemove', (e) => {
            if (isDrawing) {
                gesturePoints.push({ x: e.clientX, y: e.clientY });
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDrawing) {
                isDrawing = false;
                if (detectCircleGesture()) {
                    showEasterEggModal();
                }
                // Clear points regardless of detection outcome
                gesturePoints = []; 
            }
        });


        // --- Mouse Trail and Click Animation Logic ---
        document.addEventListener('DOMContentLoaded', () => {
            const dotContainer = document.getElementById('dot-container');
            
            // CHANGES FOR SHORTER & SMOOTHER TRAIL:
            const numDots = 20; // Reduced from 40 for a shorter trail.
            const easing = 0.08; // Reduced from 0.1 for a smoother, more gradual follow.

            const dots = [];
            let mouseX = 0, mouseY = 0;

            // 1. Create the dots
            for (let i = 0; i < numDots; i++) {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                dotContainer.appendChild(dot);
                dots.push({
                    element: dot,
                    x: 0,
                    y: 0,
                });
            }

            // 2. Track mouse movement
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            // 3. Animation loop using requestAnimationFrame for smooth trail
            function animate() {
                // Update the position of each dot
                dots.forEach((dot, index) => {
                    let opacity, size;

                    if (index === 0) {
                        // Primary dot: tracks mouse exactly, is slightly larger
                        dot.x = mouseX;
                        dot.y = mouseY;
                        opacity = 1;
                        size = 15; // Largest size for the primary cursor dot (based on 8px CSS size)
                    } else {
                        // Follower dots: target the previous dot's position
                        const prevDot = dots[index - 1];
                        dot.x += (prevDot.x - dot.x) * easing;
                        dot.y += (prevDot.y - dot.y) * easing;

                        // Calculate opacity and size: Fades dramatically towards the end
                        const decay = index / numDots;
                        opacity = Math.max(0, 0.8 - decay * 0.8);
                        size = Math.max(0.5, 15 - decay * 14.5); // Scales down from 15px to 0.5px
                    }
                    
                    // Apply styles using 3D transform (size / 8 because CSS width/height is 8px)
                    dot.element.style.transform = `translate(-50%, -50%) translate3d(${dot.x}px, ${dot.y}px, 0) scale(${size / 8})`;
                    dot.element.style.opacity = opacity;
                });

                requestAnimationFrame(animate);
            }

            // 4. Click Animation Handler (IMPROVED GLOW RIPPLE)
            document.body.addEventListener('mousedown', (e) => {
                // *** AUDIO INTEGRATION START ***
                // Ensure audio context is started on the very first mousedown event
                if (!isAudioReady) {
                    initializeAudio();
                }
                playPopSound();
                // *** AUDIO INTEGRATION END ***

                const ring = document.createElement('div');
                ring.classList.add('click-ring');
                
                // Position the ring at the click coordinates
                ring.style.left = `${e.clientX}px`;
                ring.style.top = `${e.clientY}px`;
                
                dotContainer.appendChild(ring); // Append to dot container for z-index control

                // Force reflow/repaint before starting transition
                void ring.offsetWidth;

                // Start the animation
                ring.classList.add('animate');

                // Remove the element after animation completes (500ms defined in CSS)
                setTimeout(() => {
                    ring.remove();
                }, 500); 
            });


            // Start the main animation loop
            requestAnimationFrame(animate);
        });
    