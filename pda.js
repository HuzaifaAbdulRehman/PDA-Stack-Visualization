<<<<<<< HEAD
// Define a constant for epsilon to ensure consistency
const EPSILON = 'ε';

/**
 * Represents a Pushdown Automaton
 */
class PDA {
    constructor() {
        this.states = new Set();
        this.alphabet = new Set();
        this.stackSymbols = new Set();
        this.transitions = {};
        this.initialState = null;
        this.initialStackSymbol = null;
        this.acceptStates = new Set();
    }

    
    addTransition(state, inputSymbol, stackSymbol, nextState, stackPush) {
        // Normalize epsilon
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
            inputSymbol = EPSILON;
        }
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(stackPush)) {
            stackPush = EPSILON;
        }

        const key = `${state},${inputSymbol},${stackSymbol}`;
        if (!this.transitions[key]) {
            this.transitions[key] = [];
        }
        this.transitions[key].push([nextState, stackPush]);
    }

    /**
     * Get all possible transitions from the current configuration
     * @param {string} state - Current state
     * @param {string} inputSymbol - Current input symbol
     * @param {string} stackSymbol - Top stack symbol
     * @returns {Array} - List of possible transitions
     */
    getTransitions(state, inputSymbol, stackSymbol) {
        // Normalize epsilon
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
            inputSymbol = EPSILON;
        }

        // Direct transitions with the current input symbol
        const directKey = `${state},${inputSymbol},${stackSymbol}`;
        const directTransitions = this.transitions[directKey] || [];

        // Epsilon transitions (no input consumed)
        const epsilonKey = `${state},${EPSILON},${stackSymbol}`;
        const epsilonTransitions = this.transitions[epsilonKey] || [];

        return [...directTransitions, ...epsilonTransitions];
    }
}

/**
 * Represents a configuration (state) of the PDA during processing
 */
class Configuration {
    
    constructor(state, remainingInput, stack, parent = null, transitionTaken = null) {
        this.state = state;
        this.remainingInput = remainingInput;
        this.stack = stack;
        this.parent = parent;
        this.transitionTaken = transitionTaken;
    }

    toString() {
        return `State: ${this.state}, Input: ${this.remainingInput}, Stack: ${this.stack}`;
    }
=======
// Define a constant for epsilon to ensure consistency
const EPSILON = 'ε';

/**
 * Represents a Pushdown Automaton
 */
class PDA {
    constructor() {
        this.states = new Set();
        this.alphabet = new Set();
        this.stackSymbols = new Set();
        this.transitions = {};
        this.initialState = null;
        this.initialStackSymbol = null;
        this.acceptStates = new Set();
    }

    
    addTransition(state, inputSymbol, stackSymbol, nextState, stackPush) {
        // Normalize epsilon
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
            inputSymbol = EPSILON;
        }
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(stackPush)) {
            stackPush = EPSILON;
        }

        const key = `${state},${inputSymbol},${stackSymbol}`;
        if (!this.transitions[key]) {
            this.transitions[key] = [];
        }
        this.transitions[key].push([nextState, stackPush]);
    }

    /**
     * Get all possible transitions from the current configuration
     * @param {string} state - Current state
     * @param {string} inputSymbol - Current input symbol
     * @param {string} stackSymbol - Top stack symbol
     * @returns {Array} - List of possible transitions
     */
    getTransitions(state, inputSymbol, stackSymbol) {
        // Normalize epsilon
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
            inputSymbol = EPSILON;
        }

        // Direct transitions with the current input symbol
        const directKey = `${state},${inputSymbol},${stackSymbol}`;
        const directTransitions = this.transitions[directKey] || [];

        // Epsilon transitions (no input consumed)
        const epsilonKey = `${state},${EPSILON},${stackSymbol}`;
        const epsilonTransitions = this.transitions[epsilonKey] || [];

        return [...directTransitions, ...epsilonTransitions];
    }
}

/**
 * Represents a configuration (state) of the PDA during processing
 */
class Configuration {
    
    constructor(state, remainingInput, stack, parent = null, transitionTaken = null) {
        this.state = state;
        this.remainingInput = remainingInput;
        this.stack = stack;
        this.parent = parent;
        this.transitionTaken = transitionTaken;
    }

    toString() {
        return `State: ${this.state}, Input: ${this.remainingInput}, Stack: ${this.stack}`;
    }
>>>>>>> daadfcbf66b6817a496db91bf4eed0ccf0ff18b0
} 