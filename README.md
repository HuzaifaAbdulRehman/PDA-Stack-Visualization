# PDA Stack Visualizer

A web-based tool to visualize the operation of a Pushdown Automaton (PDA) and its stack. This project allows you to:

- Define a PDA using states, alphabet, stack symbols, transitions, and accept states.
- Input a string and step through the PDA's execution.
- Visualize the stack as the PDA processes the input.
- Upload a context-free grammar (CFG) and check if it can be represented as a PDA.
- View stack traces and execution history.
- Adjust the animation speed of transitions.
- Enter configurations manually or upload configuration files.

## Features

- **PDA Definition:**
  - Enter states, alphabet, stack symbols, initial state, initial stack symbol, accept states, and transitions.
  - Transitions are entered in the format: `state,input,stack→next_state,push` (e.g., `q0,a,Z→q0,AZ`).
- **Input String:**
  - Enter the string to be processed by the PDA.
- **Controls:**
  - Load PDA, run, pause, step, reset, and save/load configuration as JSON.
  - Adjust animation speed with a slider.
- **Visualization:**
  - Stack is visualized in real time as the PDA processes the input.
  - Execution traces are shown for each step.
- **CFG Upload:**
  - Upload a context-free grammar (CFG) and check if it can be simulated by the PDA.
- **Manual and File Configuration:**
  - Enter configuration by keyboard or upload a configuration file.

## How to Use

1. **Open `index.html` in your browser.**
2. Fill in the PDA definition and input string.
3. Use the controls to load, run, pause, step, or reset the PDA.
4. Adjust animation speed as needed.
5. Upload a CFG or configuration file if desired.
6. Watch the stack and execution traces update in real time.

## File Structure

- `index.html` — Main HTML file and UI
<<<<<<< HEAD
- `js/pda.js` — PDA logic and simulation
- `js/visualizer.js` — Stack and trace visualization
- `js/main.js` — App initialization and event handling
=======
- `pda.js` — PDA logic and simulation
- `visualizer.js` — Stack and trace visualization
- `main.js` — App initialization and event handling
>>>>>>> daadfcbf66b6817a496db91bf4eed0ccf0ff18b0

## Requirements
- Modern web browser (no installation needed)

## Credits
<<<<<<< HEAD
- Developed by Huzaifa (Apna College project)

---

Feel free to fork, modify, and use for learning or teaching automata theory!
=======
- Developed by Huzaifa 


>>>>>>> daadfcbf66b6817a496db91bf4eed0ccf0ff18b0
