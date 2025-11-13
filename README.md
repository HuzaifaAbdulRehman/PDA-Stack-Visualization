# PDA Stack Visualizer

A comprehensive Pushdown Automaton (PDA) Stack Visualizer available in both Python (desktop GUI) and JavaScript (web-based) implementations. This tool helps students and educators visualize and understand how PDAs process input strings and manage stack operations in real-time.

## Description

The PDA Stack Visualizer is an educational tool designed to demonstrate the behavior of Pushdown Automata - a fundamental concept in Theory of Computation and Automata Theory. It provides interactive visualization of:

- Stack operations (push/pop)
- State transitions
- Multiple execution paths (non-deterministic PDAs)
- Input string processing
- Accept/reject states

Both implementations offer the same core functionality with different user interfaces:
- **Python Version**: Desktop application with Tkinter GUI
- **JavaScript Version**: Browser-based web application

## Technologies Used

### Python Implementation
- **Python 3.x**
- **Tkinter** - GUI framework
- **Threading** - For non-blocking animations
- **JSON** - Configuration file handling

### JavaScript Implementation
- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **Canvas API** - For stack and trace visualization

## Installation

### Python Version

#### Prerequisites
- Python 3.6 or higher

#### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/HuzaifaAbdulRehman/PDA-Stack-Visualization.git
   cd PDA-Stack-Visualization
   ```

2. Navigate to the Python implementation folder:
   ```bash
   cd Project_PDA_Stack_Visualization
   ```

3. Run the application:
   ```bash
   python pda_stack_visualizer.py
   ```

### JavaScript Version

#### Option 1: Direct File Opening
1. Clone the repository:
   ```bash
   git clone https://github.com/HuzaifaAbdulRehman/PDA-Stack-Visualization.git
   cd PDA-Stack-Visualization
   ```

2. Navigate to the JavaScript implementation folder:
   ```bash
   cd TOA_PDA_Stack_Visualizer
   ```

3. Open `index.html` in your web browser

#### Option 2: Local Server (Recommended)
```bash
cd TOA_PDA_Stack_Visualizer
# Using Python
python -m http.server 8000
# OR using Node.js
npx http-server
```
Then open `http://localhost:8000` in your browser

## Usage Instructions

### Getting Started

1. **Define Your PDA**:
   - Enter states (comma-separated): `q0, q1, q2`
   - Enter alphabet symbols: `a, b`
   - Enter stack symbols: `Z, A, B`
   - Set initial state: `q0`
   - Set initial stack symbol: `Z`
   - Set accept states: `q2`

2. **Define Transitions**:
   - Format: `state,input,stack→next_state,push`
   - Example: `q0,a,Z→q0,AZ`
   - Use `ε` for epsilon (empty) transitions

3. **Load Configuration**:
   - Click "Load PDA" to initialize your automaton
   - Or use "Load JSON" to import a pre-configured PDA

4. **Test Input Strings**:
   - Enter your input string
   - Click "Step" to advance one transition at a time
   - Click "Run" to execute the entire simulation
   - Use "Pause" to stop during execution
   - Click "Reset" to start over

### Example PDAs Included

The Python version includes several pre-configured JSON files:

- `pda_balanced_parentheses.json` - Recognizes balanced parentheses
- `pda_anbmc.json` - Recognizes strings of form a^n b^m c^m
- `pda_0n1n2n_fixed.json` - Recognizes strings of form 0^n 1^n 2^n
- `pda_even_as.json` - Recognizes strings with even number of 'a's
- `pda_specific_palindrome.json` - Recognizes specific palindromes
- `pda_wcw.json` - Recognizes strings of form wcw^R (w followed by its reverse)
- `pda_deterministic.json` - Example of a deterministic PDA
- `pda_multiple_bs.json` - Recognizes strings with specific 'b' patterns

### Features

- **Step-by-step Execution**: Advance through PDA execution one step at a time
- **Animated Visualization**: Watch stack operations in real-time
- **Multiple Traces**: View all possible execution paths for non-deterministic PDAs
- **Adjustable Speed**: Control animation speed with a slider
- **Save/Load Configurations**: Export and import PDA definitions as JSON
- **Visual Feedback**: Clear indication of accept/reject states
- **Status Display**: Real-time information about current state, stack, and remaining input

## Folder Structure

```
PDA-Stack-Visualization/
│
├── Project_PDA_Stack_Visualization/     # Python Implementation
│   ├── pda_stack_visualizer.py          # Main Python application
│   ├── pda_0n1n2n_fixed.json           # Example: 0^n 1^n 2^n language
│   ├── pda_anbmc.json                   # Example: a^n b^m c^m language
│   ├── pda_balanced_parentheses.json    # Example: Balanced parentheses
│   ├── pda_deterministic.json           # Example: Deterministic PDA
│   ├── pda_even_as.json                 # Example: Even number of a's
│   ├── pda_multiple_bs.json             # Example: Multiple b patterns
│   ├── pda_specific_palindrome.json     # Example: Specific palindromes
│   └── pda_wcw.json                     # Example: wcw^R language
│
├── TOA_PDA_Stack_Visualizer/           # JavaScript Implementation
│   ├── index.html                       # Main HTML page
│   ├── pda.js                          # PDA logic and state management
│   ├── visualizer.js                   # Canvas visualization logic
│   ├── main.js                         # UI event handlers
│   └── README.md                        # JavaScript version documentation
│
├── PDA_Stack_Visualizer_Project_Report.docx  # Project documentation
├── README.md                            # This file
└── .gitignore                          # Git ignore rules
```

## Notes

### Epsilon Transitions
- The visualizer supports epsilon (ε) transitions
- Multiple Unicode representations are normalized to ε
- Epsilon transitions don't consume input symbols

### Non-Deterministic PDAs
- The tool supports non-deterministic PDAs
- Multiple execution paths are tracked simultaneously
- All active configurations are displayed in the "Execution Traces" panel

### Stack Operations
- **Push**: Add symbols to the top of the stack
- **Pop**: Remove the top symbol (implicit in all transitions)
- **Replace**: Pop top symbol and push new symbols

### Acceptance Conditions
- A string is accepted if:
  1. All input is consumed, AND
  2. The PDA is in an accept state
- The tool shows all accepting paths for non-deterministic PDAs

## Educational Use

This tool is ideal for:
- Computer Science students studying Theory of Computation
- Educators teaching Automata Theory
- Self-learners exploring formal languages
- Debugging and testing PDA designs
- Understanding the difference between deterministic and non-deterministic PDAs

## Credits

**Developer**: Huzaifa Abdul Rehman

**Course**: Theory of Automata (TOA) / Theory of Computation

**Purpose**: Educational project for visualizing Pushdown Automata behavior

**GitHub Repository**: [PDA-Stack-Visualization](https://github.com/HuzaifaAbdulRehman/PDA-Stack-Visualization)

## License

This project is open source and available for educational purposes.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/HuzaifaAbdulRehman/PDA-Stack-Visualization/issues).

## Future Enhancements

Potential improvements include:
- More example PDAs
- Export execution traces as images
- Turing Machine visualizer extension
- Mobile-responsive design for JavaScript version
- Step-by-step tutorial mode

## Support

If you encounter any issues or have questions:
1. Check the existing example JSON files for reference
2. Ensure transition format is correct: `state,input,stack→next_state,push`
3. Verify all symbols are properly defined in their respective sets
4. Open an issue on GitHub for bugs or feature requests

---

**Made with dedication for Theory of Automata students worldwide**
