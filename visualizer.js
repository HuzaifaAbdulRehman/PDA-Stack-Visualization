/**
 * Class responsible for visualizing the PDA execution
 */
class StackVisualizer {
    constructor() {
        this.pda = new PDA();
        this.currentConfigs = [];
        this.allTraces = [];
        this.currentStep = 0;
        this.isRunning = false;
        this.animationSpeed = 1.0; // seconds between steps
        this.animationTimer = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.resetVisualization();
    }

    /**
     * Initialize references to DOM elements
     */
    initializeElements() {
        // Input elements
        this.statesInput = document.getElementById('states');
        this.alphabetInput = document.getElementById('alphabet');
        this.stackSymbolsInput = document.getElementById('stack-symbols');
        this.initialStateInput = document.getElementById('initial-state');
        this.initialStackSymbolInput = document.getElementById('initial-stack-symbol');
        this.acceptStatesInput = document.getElementById('accept-states');
        this.transitionsText = document.getElementById('transitions');
        this.inputStringInput = document.getElementById('input-string');
        
        // Buttons
        this.loadButton = document.getElementById('load-button');
        this.loadJsonButton = document.getElementById('load-json-button');
        this.saveJsonButton = document.getElementById('save-json-button');
        this.runButton = document.getElementById('run-button');
        this.pauseButton = document.getElementById('pause-button');
        this.stepButton = document.getElementById('step-button');
        this.resetButton = document.getElementById('reset-button');
        
        // Slider
        this.speedSlider = document.getElementById('speed-slider');
        
        // Status and visualization elements
        this.statusText = document.getElementById('status-text');
        this.stackCanvas = document.getElementById('stack-canvas');
        this.tracesCanvas = document.getElementById('traces-canvas');
        
        // Get contexts for canvases
        this.stackCtx = this.stackCanvas.getContext('2d');
        this.tracesCtx = this.tracesCanvas.getContext('2d');
        
        // Resize canvases to fill their containers
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    /**
     * Set up event listeners for buttons and controls
     */
    setupEventListeners() {
        this.loadButton.addEventListener('click', () => this.loadPda());
        this.loadJsonButton.addEventListener('click', () => this.loadFromJson());
        this.saveJsonButton.addEventListener('click', () => this.saveToJson());
        this.runButton.addEventListener('click', () => this.runSimulation());
        this.pauseButton.addEventListener('click', () => this.pauseSimulation());
        this.stepButton.addEventListener('click', () => this.stepSimulation());
        this.resetButton.addEventListener('click', () => this.resetVisualization());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
        });
    }

    /**
     * Resize canvases to fit their containers
     */
    resizeCanvases() {
        // Stack canvas
        this.stackCanvas.width = this.stackCanvas.clientWidth;
        this.stackCanvas.height = this.stackCanvas.clientHeight;
        
        // Traces canvas
        this.tracesCanvas.width = this.tracesCanvas.clientWidth;
        this.tracesCanvas.height = this.tracesCanvas.clientHeight;
        
        // Redraw if we have data
        if (this.currentConfigs.length > 0) {
            this.drawStack(this.currentConfigs[0]);
            this.drawTraces();
        }
    }

    /**
     * Update the status text area
     * @param {string} message - Message to display
     */
    updateStatus(message) {
        this.statusText.textContent = message;
    }

    /**
     * Reset the visualization to initial state
     */
    resetVisualization() {
        // Clear canvases
        this.stackCtx.clearRect(0, 0, this.stackCanvas.width, this.stackCanvas.height);
        this.tracesCtx.clearRect(0, 0, this.tracesCanvas.width, this.tracesCanvas.height);
        
        // Reset state
        this.currentConfigs = [];
        this.allTraces = [];
        this.currentStep = 0;
        this.isRunning = false;
        
        // Reset UI
        this.runButton.disabled = false;
        this.pauseButton.disabled = true;
        this.stepButton.disabled = false;
        
        // Clear any ongoing animation
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
        
        // Initialize with the start configuration if PDA is loaded
        if (this.pda.initialState) {
            const inputString = this.inputStringInput.value;
            const initialConfig = new Configuration(
                this.pda.initialState,
                inputString,
                this.pda.initialStackSymbol,
                null,
                null
            );
            this.currentConfigs = [initialConfig];
            this.drawStack(initialConfig);
            this.updateStatus(`Ready to execute input: ${inputString}`);
        }
    }
    
    /**
     * Load PDA from UI inputs
     */
    loadPda() {
        try {
            this.pda = new PDA();
            
            // Parse states
            this.pda.states = new Set(
                this.statesInput.value.split(',').map(s => s.trim()).filter(Boolean)
            );
            
            // Parse alphabet
            this.pda.alphabet = new Set(
                this.alphabetInput.value.split(',').map(s => s.trim()).filter(Boolean)
            );
            this.pda.alphabet.add(EPSILON); // Add epsilon for epsilon transitions
            
            // Parse stack symbols
            this.pda.stackSymbols = new Set(
                this.stackSymbolsInput.value.split(',').map(s => s.trim()).filter(Boolean)
            );
            
            // Set initial state
            this.pda.initialState = this.initialStateInput.value.trim();
            if (!this.pda.states.has(this.pda.initialState)) {
                throw new Error(`Initial state '${this.pda.initialState}' not in state set`);
            }
            
            // Set initial stack symbol
            this.pda.initialStackSymbol = this.initialStackSymbolInput.value.trim();
            if (!this.pda.stackSymbols.has(this.pda.initialStackSymbol)) {
                throw new Error(`Initial stack symbol '${this.pda.initialStackSymbol}' not in stack symbol set`);
            }
            
            // Parse accept states
            this.pda.acceptStates = new Set(
                this.acceptStatesInput.value.split(',').map(s => s.trim()).filter(Boolean)
            );
            for (const state of this.pda.acceptStates) {
                if (!this.pda.states.has(state)) {
                    throw new Error(`Accept state '${state}' not in state set`);
                }
            }
            
            // Pre-validate transitions for missing stack symbols
            const transitionText = this.transitionsText.value;
            const missingStackSymbols = new Set();
            
            for (const line of transitionText.split('\n')) {
                if (!line.trim()) continue;
                
                // Expected format: "q0,a,Z→q0,AZ"
                const match = line.match(/([^,]+),([^,]+),([^→]+)→([^,]+),(.*)/);
                if (match) {
                    let [_, __, inputSymbol, ___, ____, stackPush] = match;
                    inputSymbol = inputSymbol.trim();
                    stackPush = stackPush.trim();
                    
                    // Normalize epsilon
                    if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
                        inputSymbol = EPSILON;
                    }
                    
                    if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(stackPush)) {
                        stackPush = EPSILON;
                    }
                    
                    if (stackPush && stackPush !== EPSILON) {
                        for (const symbol of stackPush) {
                            if (!this.pda.stackSymbols.has(symbol)) {
                                missingStackSymbols.add(symbol);
                            }
                        }
                    }
                }
            }
            
            // If there are missing stack symbols, ask the user if they want to add them
            if (missingStackSymbols.size > 0) {
                const shouldAdd = confirm(`The following stack symbols are used in transitions but not defined: ${[...missingStackSymbols].join(', ')}\n\nDo you want to add them to your stack symbols?`);
                
                if (shouldAdd) {
                    // Add the missing symbols to the stack symbols
                    for (const symbol of missingStackSymbols) {
                        this.pda.stackSymbols.add(symbol);
                    }
                    
                    // Update the stack symbols input
                    this.stackSymbolsInput.value = [...this.pda.stackSymbols].join(', ');
                    
                    this.updateStatus(`Added missing stack symbols: ${[...missingStackSymbols].join(', ')}`);
                }
            }
            
            // Now parse transitions
            for (const line of transitionText.split('\n')) {
                if (!line.trim()) continue;
                
                // Expected format: "q0,a,Z→q0,AZ"
                const match = line.match(/([^,]+),([^,]+),([^→]+)→([^,]+),(.*)/);
                if (!match) {
                    throw new Error(`Invalid transition format: ${line}`);
                }
                
                let [_, state, inputSymbol, stackSymbol, nextState, stackPush] = match;
                state = state.trim();
                inputSymbol = inputSymbol.trim();
                stackSymbol = stackSymbol.trim();
                nextState = nextState.trim();
                stackPush = stackPush.trim();
                
                // Normalize epsilon
                if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
                    inputSymbol = EPSILON;
                }
                
                if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(stackPush)) {
                    stackPush = EPSILON;
                }
                
                if (!this.pda.states.has(state)) {
                    throw new Error(`State '${state}' in transition not in state set`);
                }
                if (!this.pda.states.has(nextState)) {
                    throw new Error(`Next state '${nextState}' in transition not in state set`);
                }
                if (inputSymbol !== EPSILON && !this.pda.alphabet.has(inputSymbol)) {
                    throw new Error(`Input symbol '${inputSymbol}' in transition not in alphabet`);
                }
                if (!this.pda.stackSymbols.has(stackSymbol)) {
                    throw new Error(`Stack symbol '${stackSymbol}' in transition not in stack symbol set`);
                }
                
                // Check stack push symbols
                if (stackPush !== EPSILON) { // ε means pop only
                    for (const symbol of stackPush) {
                        if (!this.pda.stackSymbols.has(symbol)) {
                            throw new Error(`Push symbol '${symbol}' in transition not in stack symbol set. Please add '${symbol}' to your stack symbols list.`);
                        }
                    }
                }
                
                this.pda.addTransition(state, inputSymbol, stackSymbol, nextState, stackPush);
            }
            
            this.updateStatus("PDA loaded successfully!");
            this.resetVisualization();
            
        } catch (err) {
            alert(`Error Loading PDA: ${err.message}`);
            this.updateStatus(`Error: ${err.message}`);
        }
    }
    
    /**
     * Load PDA configuration from a JSON file
     */
    loadFromJson() {
        try {
            // Create file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const config = JSON.parse(e.target.result);
                        
                        // Validate stack symbols in transitions before loading
                        const stackSymbols = new Set(config.stack_symbols || []);
                        const transitions = config.transitions || [];
                        
                        // Check if all push symbols are in the stack symbols set
                        const addedSymbols = new Set();
                        
                        for (const transition of transitions) {
                            let stackPush = transition.stack_push || '';
                            
                            // Normalize epsilon
                            if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(stackPush)) {
                                transition.stack_push = EPSILON;
                                stackPush = EPSILON;
                            }
                            
                            if (stackPush && stackPush !== EPSILON) {
                                for (const symbol of stackPush) {
                                    if (!stackSymbols.has(symbol)) {
                                        // Add the missing symbol to the stack symbols
                                        stackSymbols.add(symbol);
                                        addedSymbols.add(symbol);
                                    }
                                }
                            }
                            
                            // Also normalize input_symbol
                            let inputSymbol = transition.input_symbol || '';
                            if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
                                transition.input_symbol = EPSILON;
                            }
                        }
                        
                        // Update the config with any added stack symbols
                        config.stack_symbols = [...stackSymbols];
                        
                        // Populate UI fields with the loaded configuration
                        this.statesInput.value = (config.states || []).join(', ');
                        this.alphabetInput.value = (config.alphabet || []).join(', ');
                        this.stackSymbolsInput.value = (config.stack_symbols || []).join(', ');
                        this.initialStateInput.value = config.initial_state || '';
                        this.initialStackSymbolInput.value = config.initial_stack_symbol || '';
                        this.acceptStatesInput.value = (config.accept_states || []).join(', ');
                        
                        // Handle transitions
                        const transitionLines = [];
                        
                        for (const transition of transitions) {
                            const fromState = transition.from_state || '';
                            let inputSymbol = transition.input_symbol || '';
                            const stackSymbol = transition.stack_symbol || '';
                            const toState = transition.to_state || '';
                            let stackPush = transition.stack_push || '';
                            
                            // Normalize epsilon for display
                            if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
                                inputSymbol = EPSILON;
                            }
                            if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(stackPush)) {
                                stackPush = EPSILON;
                            }
                            
                            const transitionLine = `${fromState},${inputSymbol},${stackSymbol}→${toState},${stackPush}`;
                            transitionLines.push(transitionLine);
                        }
                        
                        this.transitionsText.value = transitionLines.join('\n');
                        
                        // Set input string if provided
                        if (config.input_string) {
                            this.inputStringInput.value = config.input_string;
                        }
                        
                        // If any symbols were added, inform the user
                        if (addedSymbols.size > 0) {
                            this.updateStatus(`PDA configuration loaded from ${file.name}\nAdded missing stack symbols: ${[...addedSymbols].join(', ')}`);
                        } else {
                            this.updateStatus(`PDA configuration loaded from ${file.name}`);
                        }
                        
                        // Automatically load the PDA
                        this.loadPda();
                        
                    } catch (err) {
                        alert(`Error Loading JSON: ${err.message}`);
                        this.updateStatus(`Error loading JSON: ${err.message}`);
                    }
                };
                
                reader.readAsText(file);
            });
            
            fileInput.click();
            
        } catch (err) {
            alert(`Error Loading JSON: ${err.message}`);
            this.updateStatus(`Error loading JSON: ${err.message}`);
        }
    }
    
    /**
     * Save current PDA configuration to a JSON file
     */
    saveToJson() {
        try {
            // First ensure the PDA is correctly loaded from UI to capture any changes
            this.loadPda();
            
            // Create the configuration dictionary
            const config = {
                states: [...this.pda.states],
                alphabet: [...this.pda.alphabet].filter(s => s !== EPSILON), // Exclude epsilon from alphabet
                stack_symbols: [...this.pda.stackSymbols],
                initial_state: this.pda.initialState,
                initial_stack_symbol: this.pda.initialStackSymbol,
                accept_states: [...this.pda.acceptStates],
                input_string: this.inputStringInput.value,
                transitions: []
            };
            
            // Format transitions
            for (const key in this.pda.transitions) {
                const [state, inputSymbol, stackSymbol] = key.split(',');
                
                for (const [nextState, stackPush] of this.pda.transitions[key]) {
                    const transition = {
                        from_state: state,
                        input_symbol: inputSymbol,
                        stack_symbol: stackSymbol,
                        to_state: nextState,
                        stack_push: stackPush
                    };
                    config.transitions.push(transition);
                }
            }
            
            // Create and trigger download
            const jsonString = JSON.stringify(config, null, 4);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pda_config.json';
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.updateStatus('PDA configuration saved to pda_config.json');
            
        } catch (err) {
            alert(`Error Saving JSON: ${err.message}`);
            this.updateStatus(`Error saving JSON: ${err.message}`);
        }
    }
    
    /**
     * Run the simulation from the current point to completion
     */
    runSimulation() {
        if (this.currentConfigs.length === 0) {
            this.resetVisualization();
            if (this.currentConfigs.length === 0) {
                alert("Please load a PDA configuration first");
                return;
            }
        }
        
        this.isRunning = true;
        this.runButton.disabled = true;
        this.pauseButton.disabled = false;
        this.stepButton.disabled = true;
        
        this.runSimulationStep();
    }
    
    /**
     * Run a single step of the simulation and schedule the next one if still running
     */
    runSimulationStep() {
        if (!this.isRunning) return;
        
        let allDone = true;
        
        for (const config of this.currentConfigs) {
            if (config.remainingInput || this.canTakeEpsilonTransition(config)) {
                allDone = false;
                break;
            }
        }
        
        if (allDone) {
            this.finishSimulation();
            return;
        }
        
        this.stepSimulation();
        
        // Schedule next step
        this.animationTimer = setTimeout(() => this.runSimulationStep(), this.animationSpeed * 1000);
    }
    
    /**
     * Handles completion of simulation
     */
    finishSimulation() {
        this.isRunning = false;
        
        if (this.currentConfigs.length === 0) {
            this.updateStatus("No valid configurations remain. String rejected.");
        } else {
            const accepted = this.currentConfigs.some(config => 
                this.pda.acceptStates.has(config.state)
            );
            
            if (accepted) {
                this.updateStatus("String accepted! In an accept state.");
            } else {
                this.updateStatus("String processed but not accepted. Not in an accept state.");
            }
        }
        
        this.pauseButton.disabled = true;
        this.runButton.disabled = false;
        this.stepButton.disabled = false;
    }
    
    /**
     * Pause the running simulation
     */
    pauseSimulation() {
        this.isRunning = false;
        this.pauseButton.disabled = true;
        this.runButton.disabled = false;
        this.stepButton.disabled = false;
        
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
    }
    
    /**
     * Check if the configuration can take an epsilon transition
     * @param {Configuration} config - The current configuration
     * @returns {boolean} - True if epsilon transition is possible
     */
    canTakeEpsilonTransition(config) {
        if (!config.stack) return false;
        
        const stackTop = config.stack[0];
        const key = `${config.state},${EPSILON},${stackTop}`;
        return this.pda.transitions[key] !== undefined;
    }
    
    /**
     * Advance the simulation by one step
     */
    stepSimulation() {
        if (this.currentConfigs.length === 0) {
            this.resetVisualization();
            if (this.currentConfigs.length === 0) {
                alert("Please load a PDA configuration first");
                return;
            }
        }
        
        const newConfigs = [];
        
        for (const config of this.currentConfigs) {
            // If stack is empty, can't transition
            if (!config.stack) continue;
            
            const stackTop = config.stack[0];
            let transitionsTaken = false;
            
            // First try regular input transitions if there are remaining inputs
            if (config.remainingInput) {
                const currentInput = config.remainingInput[0];
                const remaining = config.remainingInput.slice(1);
                
                // Check transitions for the current input
                const transitions = this.pda.getTransitions(config.state, currentInput, stackTop);
                for (const [nextState, stackPush] of transitions) {
                    transitionsTaken = true;
                    const newStack = this.updateStack(config.stack, stackPush);
                    const transitionInfo = `${config.state}, ${currentInput}, ${stackTop} → ${nextState}, ${stackPush || EPSILON}`;
                    
                    const newConfig = new Configuration(
                        nextState,
                        remaining,
                        newStack,
                        config,
                        transitionInfo
                    );
                    newConfigs.push(newConfig);
                }
            }
            
            // If no regular transitions or we can take epsilon transitions
            const epsilonKey = `${config.state},${EPSILON},${stackTop}`;
            const epsilonTransitions = this.pda.transitions[epsilonKey] || [];
            
            for (const [nextState, stackPush] of epsilonTransitions) {
                transitionsTaken = true;
                const newStack = this.updateStack(config.stack, stackPush);
                const transitionInfo = `${config.state}, ${EPSILON}, ${stackTop} → ${nextState}, ${stackPush || EPSILON}`;
                
                const newConfig = new Configuration(
                    nextState,
                    config.remainingInput,
                    newStack,
                    config,
                    transitionInfo
                );
                newConfigs.push(newConfig);
            }
            
            // If no transitions taken and there's no input left
            if (!transitionsTaken && !config.remainingInput) {
                newConfigs.push(config); // Keep this config as is
            }
        }
        
        // Update current configurations
        this.currentConfigs = newConfigs;
        this.currentStep += 1;
        
        // Update the visualization
        this.stackCtx.clearRect(0, 0, this.stackCanvas.width, this.stackCanvas.height);
        this.tracesCtx.clearRect(0, 0, this.tracesCanvas.width, this.tracesCanvas.height);
        
        this.allTraces = this.allTraces.concat(this.currentConfigs);
        
        // Visualize all currently active configs
        if (this.currentConfigs.length > 0) {
            // Show the first configuration's stack in detail
            this.drawStack(this.currentConfigs[0]);
            
            // Draw all traces in the traces canvas
            this.drawTraces();
            
            // Update status with number of active configurations
            let statusMessage = `Step ${this.currentStep}: ${this.currentConfigs.length} active configuration(s)`;
            
            if (this.currentConfigs.length > 0) {
                const config = this.currentConfigs[0];
                statusMessage += `\nCurrent State: ${config.state}`;
                statusMessage += `\nRemaining Input: ${config.remainingInput || EPSILON}`;
                statusMessage += `\nStack: ${config.stack || 'empty'}`;
                
                if (config.transitionTaken) {
                    statusMessage += `\nTransition: ${config.transitionTaken}`;
                }
            }
            
            this.updateStatus(statusMessage);
        } else {
            this.updateStatus(`Step ${this.currentStep}: No valid configurations remain. String rejected.`);
        }
    }
    
    /**
     * Update the stack based on the transition
     * @param {string} stack - Current stack content
     * @param {string} stackPush - Symbols to push
     * @returns {string} - New stack content
     */
    updateStack(stack, stackPush) {
        // Pop the top symbol
        let newStack = stack.slice(1) || "";
        
        // Push new symbols (if any)
        if (stackPush && stackPush !== EPSILON) {
            newStack = stackPush + newStack;
        }
        
        return newStack;
    }
    
    /**
     * Draw the stack for a single configuration
     * @param {Configuration} config - Configuration to visualize
     */
    drawStack(config) {
        if (!config || !config.stack) return;
        
        const stack = config.stack;
        const canvasWidth = this.stackCanvas.width;
        const canvasHeight = this.stackCanvas.height;
        
        // Clear canvas
        this.stackCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw stack title and state info
        this.stackCtx.font = "bold 12px Arial";
        this.stackCtx.textAlign = "center";
        this.stackCtx.fillText(
            `State: ${config.state} | Input: ${config.remainingInput || EPSILON}`,
            canvasWidth / 2,
            20
        );
        
        // Draw the stack
        const stackWidth = 100;
        const elementHeight = 40;
        
        // Position the stack in the center of the canvas
        const stackX = canvasWidth / 2 - stackWidth / 2;
        
        // Draw bottom of stack
        this.stackCtx.fillStyle = "lightgray";
        this.stackCtx.strokeStyle = "black";
        this.stackCtx.beginPath();
        this.stackCtx.rect(
            stackX,
            canvasHeight - 30,
            stackWidth,
            20
        );
        this.stackCtx.fill();
        this.stackCtx.stroke();
        
        // Draw stack elements from bottom to top
        if (stack) {
            const maxVisible = Math.min(10, stack.length); // Limit number of visible elements
            
            for (let i = 0; i < maxVisible; i++) {
                const yPos = canvasHeight - 30 - (i + 1) * elementHeight;
                
                this.stackCtx.fillStyle = i === 0 ? "lightblue" : "white";
                this.stackCtx.beginPath();
                this.stackCtx.rect(
                    stackX,
                    yPos,
                    stackWidth,
                    elementHeight
                );
                this.stackCtx.fill();
                this.stackCtx.stroke();
                
                this.stackCtx.fillStyle = "black";
                this.stackCtx.font = "bold 14px Arial";
                this.stackCtx.fillText(
                    stack[i],
                    stackX + stackWidth / 2,
                    yPos + elementHeight / 2 + 5 // +5 for vertical centering
                );
            }
            
            // If there are more elements than we can show
            if (stack.length > maxVisible) {
                this.stackCtx.font = "10px Arial";
                this.stackCtx.fillText(
                    `... ${stack.length - maxVisible} more`,
                    stackX + stackWidth / 2,
                    canvasHeight - 30 - (maxVisible + 1) * elementHeight
                );
            }
        } else {
            // Empty stack message
            this.stackCtx.font = "italic 10px Arial";
            this.stackCtx.fillText(
                "Empty Stack",
                stackX + stackWidth / 2,
                canvasHeight - 60
            );
        }
        
        // Draw transition information
        if (config.transitionTaken) {
            this.stackCtx.font = "10px Arial";
            this.stackCtx.fillStyle = "blue";
            this.stackCtx.fillText(
                `Transition: ${config.transitionTaken}`,
                canvasWidth / 2,
                50
            );
        }
        
        // Draw accept/reject status
        if (!config.remainingInput) {
            const isAccepted = this.pda.acceptStates.has(config.state);
            const statusText = isAccepted ? "ACCEPT" : "Not Accepted";
            this.stackCtx.font = "bold 12px Arial";
            this.stackCtx.fillStyle = isAccepted ? "green" : "red";
            this.stackCtx.fillText(
                statusText,
                canvasWidth / 2,
                80
            );
        }
    }
    
    /**
     * Draw all active execution traces
     */
    drawTraces() {
        const canvasWidth = this.tracesCanvas.width;
        const canvasHeight = this.tracesCanvas.height;
        
        // Clear canvas
        this.tracesCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Number of active configurations
        const numConfigs = this.currentConfigs.length;
        if (numConfigs === 0) {
            this.tracesCtx.font = "italic 10px Arial";
            this.tracesCtx.textAlign = "center";
            this.tracesCtx.fillText(
                "No active configurations",
                canvasWidth / 2,
                canvasHeight / 2
            );
            return;
        }
        
        // Calculate spacing
        const traceWidth = Math.min(150, canvasWidth / numConfigs);
        const spacing = Math.min(20, (canvasWidth - numConfigs * traceWidth) / (numConfigs + 1));
        
        // Draw each active configuration's trace
        for (let i = 0; i < numConfigs; i++) {
            const config = this.currentConfigs[i];
            const xPos = spacing + i * (traceWidth + spacing);
            
            // Draw a box for this trace
            this.tracesCtx.fillStyle = "lightyellow";
            this.tracesCtx.strokeStyle = "black";
            this.tracesCtx.beginPath();
            this.tracesCtx.rect(
                xPos,
                10,
                traceWidth,
                canvasHeight - 20
            );
            this.tracesCtx.fill();
            this.tracesCtx.stroke();
            
            // Draw trace number
            this.tracesCtx.fillStyle = "black";
            this.tracesCtx.font = "bold 8px Arial";
            this.tracesCtx.textAlign = "center";
            this.tracesCtx.fillText(
                `Trace ${i+1}`,
                xPos + traceWidth / 2,
                20
            );
            
            // Draw state
            this.tracesCtx.font = "8px Arial";
            this.tracesCtx.fillText(
                `State: ${config.state}`,
                xPos + traceWidth / 2,
                40
            );
            
            // Draw simplified stack representation
            const stackText = config.stack.length > 3 ? 
                config.stack.slice(0, 3) + "..." : 
                config.stack || EPSILON;
            this.tracesCtx.fillText(
                `Stack: ${stackText}`,
                xPos + traceWidth / 2,
                60
            );
            
            // Draw remaining input (simplified)
            const inputText = config.remainingInput.length > 3 ? 
                config.remainingInput.slice(0, 3) + "..." : 
                config.remainingInput || EPSILON;
            this.tracesCtx.fillText(
                `Input: ${inputText}`,
                xPos + traceWidth / 2,
                80
            );
            
            // Draw accept/reject status
            if (!config.remainingInput) {
                const isAccepted = this.pda.acceptStates.has(config.state);
                const statusText = isAccepted ? "ACCEPT" : "REJECT";
                this.tracesCtx.font = "bold 8px Arial";
                this.tracesCtx.fillStyle = isAccepted ? "green" : "red";
                this.tracesCtx.fillText(
                    statusText,
                    xPos + traceWidth / 2,
                    100
                );
            }
        }
    }
} 