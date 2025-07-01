const EPSILON = 'ε';

/**
 * Represents a Pushdown Automaton (PDA)
 */
class PDA {
    constructor() {
        this.states = new Set();              // All states in the PDA
        this.alphabet = new Set();            // Input alphabet
        this.stackSymbols = new Set();        // Stack symbols used
        this.transitions = {};                // Transition function
        this.initialState = null;             // Starting state
        this.initialStackSymbol = null;       // Starting symbol on the stack
        this.acceptStates = new Set();        // Accepting states
    }

    /**
     * Adds a transition rule to the PDA.
     * 
     * @param {string} state - Current state
     * @param {string} inputSymbol - Input symbol (could be ε)
     * @param {string} stackSymbol - Symbol to pop from stack
     * @param {string} nextState - Next state after transition
     * @param {string} stackPush - Symbol(s) to push on stack (or ε)
     */
    addTransition(state, inputSymbol, stackSymbol, nextState, stackPush) {
        // Normalize epsilon input
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
            inputSymbol = EPSILON;
        }

        // Normalize epsilon stack push
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
     * Retrieves all possible transitions from a given configuration.
     * Includes both direct and ε-transitions.
     * 
     * @param {string} state - Current state
     * @param {string} inputSymbol - Current input symbol
     * @param {string} stackSymbol - Top symbol on stack
     * @returns {Array} List of possible transitions
     */
    getTransitions(state, inputSymbol, stackSymbol) {
        // Normalize epsilon input
        if (['ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''].includes(inputSymbol)) {
            inputSymbol = EPSILON;
        }

        const directKey = `${state},${inputSymbol},${stackSymbol}`;
        const epsilonKey = `${state},${EPSILON},${stackSymbol}`;

        const directTransitions = this.transitions[directKey] || [];
        const epsilonTransitions = this.transitions[epsilonKey] || [];

        return [...directTransitions, ...epsilonTransitions];
    }
}

/**
 * Represents a single PDA configuration during input processing.
 */
class Configuration {
    /**
     * 
     * @param {string} state - Current PDA state
     * @param {string} remainingInput - Remaining input string
     * @param {Array} stack - Current stack contents (array)
     * @param {Configuration|null} parent - Previous configuration (for tracing)
     * @param {Object|null} transitionTaken - Last transition used to reach this config
     */
    constructor(state, remainingInput, stack, parent = null, transitionTaken = null) {
        this.state = state;
        this.remainingInput = remainingInput;
        this.stack = stack;
        this.parent = parent;
        this.transitionTaken = transitionTaken;
    }

    /**
     * Returns a string representation of this configuration.
     */
    toString() {
        return `State: ${this.state}, Input: ${this.remainingInput}, Stack: ${this.stack}`;
    }
}
