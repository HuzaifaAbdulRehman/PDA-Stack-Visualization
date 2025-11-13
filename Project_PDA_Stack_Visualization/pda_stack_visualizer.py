import tkinter as tk
from tkinter import ttk, messagebox, simpledialog, filedialog
import time
import re
import json
from collections import defaultdict, deque
import threading

# Define a constant for epsilon to ensure consistency
EPSILON = 'ε'

class PDA:
    def __init__(self):
        self.states = set()
        self.alphabet = set()
        self.stack_symbols = set()
        self.transitions = {}
        self.initial_state = None
        self.initial_stack_symbol = None
        self.accept_states = set()
    
    def add_transition(self, state, input_symbol, stack_symbol, next_state, stack_push):
        """Add a transition to the PDA"""
        # Normalize epsilon
        if input_symbol in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
            input_symbol = EPSILON
        if stack_push in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
            stack_push = EPSILON
            
        key = (state, input_symbol, stack_symbol)
        if key not in self.transitions:
            self.transitions[key] = []
        self.transitions[key].append((next_state, stack_push))
    
    def get_transitions(self, state, input_symbol, stack_symbol):
        """Get all possible transitions from the current configuration"""
        # Normalize epsilon
        if input_symbol in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
            input_symbol = EPSILON
            
        # Direct transitions with the current input symbol
        direct_transitions = self.transitions.get((state, input_symbol, stack_symbol), [])
        
        # Epsilon transitions (no input consumed)
        epsilon_transitions = self.transitions.get((state, EPSILON, stack_symbol), [])
        
        return direct_transitions + epsilon_transitions

class Configuration:
    def __init__(self, state, remaining_input, stack, parent=None, transition_taken=None):
        self.state = state
        self.remaining_input = remaining_input
        self.stack = stack
        self.parent = parent
        self.transition_taken = transition_taken  # Stores information about how we got here
    
    def __repr__(self):
        return f"State: {self.state}, Input: {self.remaining_input}, Stack: {self.stack}"

class StackVisualizer(tk.Tk):
    def __init__(self):
        super().__init__()
        
        self.title("PDA Stack Visualizer")
        self.geometry("1200x800")
        
        self.pda = PDA()
        self.current_configs = []
        self.all_traces = []
        self.current_step = 0
        self.is_running = False
        self.execution_thread = None
        self.animation_speed = 1.0  # seconds between steps
        
        self.create_widgets()
        self.reset_visualization()
        
    def create_widgets(self):
        # Main frame for the entire UI
        main_frame = ttk.Frame(self)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left panel for configuration and controls
        left_panel = ttk.Frame(main_frame, width=400)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, padx=5, pady=5)
        
        # PDA Definition section
        pda_frame = ttk.LabelFrame(left_panel, text="PDA Definition")
        pda_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        ttk.Label(pda_frame, text="States (comma-separated):").pack(anchor=tk.W, padx=5, pady=2)
        self.states_entry = ttk.Entry(pda_frame)
        self.states_entry.pack(fill=tk.X, padx=5, pady=2)
        self.states_entry.insert(0, "q0, q1, q2")
        
        ttk.Label(pda_frame, text="Alphabet (comma-separated):").pack(anchor=tk.W, padx=5, pady=2)
        self.alphabet_entry = ttk.Entry(pda_frame)
        self.alphabet_entry.pack(fill=tk.X, padx=5, pady=2)
        self.alphabet_entry.insert(0, "a, b")
        
        ttk.Label(pda_frame, text="Stack Symbols (comma-separated):").pack(anchor=tk.W, padx=5, pady=2)
        self.stack_symbols_entry = ttk.Entry(pda_frame)
        self.stack_symbols_entry.pack(fill=tk.X, padx=5, pady=2)
        self.stack_symbols_entry.insert(0, "Z, A, B")
        
        ttk.Label(pda_frame, text="Initial State:").pack(anchor=tk.W, padx=5, pady=2)
        self.initial_state_entry = ttk.Entry(pda_frame)
        self.initial_state_entry.pack(fill=tk.X, padx=5, pady=2)
        self.initial_state_entry.insert(0, "q0")
        
        ttk.Label(pda_frame, text="Initial Stack Symbol:").pack(anchor=tk.W, padx=5, pady=2)
        self.initial_stack_symbol_entry = ttk.Entry(pda_frame)
        self.initial_stack_symbol_entry.pack(fill=tk.X, padx=5, pady=2)
        self.initial_stack_symbol_entry.insert(0, "Z")
        
        ttk.Label(pda_frame, text="Accept States (comma-separated):").pack(anchor=tk.W, padx=5, pady=2)
        self.accept_states_entry = ttk.Entry(pda_frame)
        self.accept_states_entry.pack(fill=tk.X, padx=5, pady=2)
        self.accept_states_entry.insert(0, "q2")
        
        ttk.Label(pda_frame, text="Transitions (state,input,stack→next_state,push):").pack(anchor=tk.W, padx=5, pady=2)
        self.transitions_text = tk.Text(pda_frame, height=10)
        self.transitions_text.pack(fill=tk.BOTH, padx=5, pady=2)
        self.transitions_text.insert("1.0", "q0,a,Z→q0,AZ\nq0,a,A→q0,AA\nq0,b,A→q1,ε\nq1,b,A→q1,ε\nq1,ε,Z→q2,Z")
        
        # Input String section
        input_frame = ttk.LabelFrame(left_panel, text="Input String")
        input_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(input_frame, text="Input String:").pack(anchor=tk.W, padx=5, pady=2)
        self.input_string_entry = ttk.Entry(input_frame)
        self.input_string_entry.pack(fill=tk.X, padx=5, pady=2)
        self.input_string_entry.insert(0, "aabb")
        
        # Controls section
        controls_frame = ttk.LabelFrame(left_panel, text="Controls")
        controls_frame.pack(fill=tk.X, padx=5, pady=5)
        
        button_frame = ttk.Frame(controls_frame)
        button_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.load_button = ttk.Button(button_frame, text="Load PDA", command=self.load_pda)
        self.load_button.pack(side=tk.LEFT, padx=5)
        
        self.json_button = ttk.Button(button_frame, text="Load JSON", command=self.load_from_json)
        self.json_button.pack(side=tk.LEFT, padx=5)
        
        self.save_json_button = ttk.Button(button_frame, text="Save JSON", command=self.save_to_json)
        self.save_json_button.pack(side=tk.LEFT, padx=5)
        
        self.run_button = ttk.Button(button_frame, text="Run", command=self.run_simulation)
        self.run_button.pack(side=tk.LEFT, padx=5)
        
        self.pause_button = ttk.Button(button_frame, text="Pause", command=self.pause_simulation)
        self.pause_button.pack(side=tk.LEFT, padx=5)
        self.pause_button.config(state=tk.DISABLED)
        
        self.step_button = ttk.Button(button_frame, text="Step", command=self.step_simulation)
        self.step_button.pack(side=tk.LEFT, padx=5)
        
        self.reset_button = ttk.Button(button_frame, text="Reset", command=self.reset_visualization)
        self.reset_button.pack(side=tk.LEFT, padx=5)
        
        speed_frame = ttk.Frame(controls_frame)
        speed_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(speed_frame, text="Animation Speed:").pack(side=tk.LEFT, padx=5)
        self.speed_scale = ttk.Scale(speed_frame, from_=0.1, to=2.0, orient=tk.HORIZONTAL, 
                                    command=self.update_speed)
        self.speed_scale.set(1.0)
        self.speed_scale.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        
        # Status information
        status_frame = ttk.LabelFrame(left_panel, text="Status")
        status_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.status_text = tk.Text(status_frame, height=5, width=40, wrap=tk.WORD)
        self.status_text.pack(fill=tk.BOTH, padx=5, pady=5)
        self.status_text.config(state=tk.DISABLED)
        
        # Right panel for visualization
        right_panel = ttk.Frame(main_frame)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Canvas for stack visualization
        visualization_frame = ttk.LabelFrame(right_panel, text="Stack Visualization")
        visualization_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.canvas = tk.Canvas(visualization_frame, bg="white")
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Traces frame showing multiple execution paths
        traces_frame = ttk.LabelFrame(right_panel, text="Execution Traces")
        traces_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.traces_canvas = tk.Canvas(traces_frame, bg="white", height=150)
        self.traces_canvas.pack(fill=tk.X, padx=5, pady=5)

    def load_from_json(self):
        """Load PDA configuration from a JSON file"""
        try:
            file_path = filedialog.askopenfilename(
                title="Select JSON Configuration File",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            
            if not file_path:
                return  # User cancelled the operation
                
            with open(file_path, 'r') as file:
                config = json.load(file)
            
            # Validate stack symbols in transitions before loading
            stack_symbols = set(config.get("stack_symbols", []))
            original_stack_symbol_count = len(stack_symbols)
            transitions = config.get("transitions", [])
            
            # Check if all push symbols are in the stack symbols set
            added_symbols = set()
            for transition in transitions:
                stack_push = transition.get("stack_push", "")
                
                # Normalize epsilon
                if stack_push in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                    transition["stack_push"] = EPSILON
                    stack_push = EPSILON
                    
                if stack_push and stack_push != EPSILON:
                    for symbol in stack_push:
                        if symbol not in stack_symbols:
                            # Add the missing symbol to the stack symbols
                            stack_symbols.add(symbol)
                            added_symbols.add(symbol)
                            
                # Also normalize input_symbol
                input_symbol = transition.get("input_symbol", "")
                if input_symbol in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                    transition["input_symbol"] = EPSILON
            
            # Update the config with any added stack symbols
            config["stack_symbols"] = list(stack_symbols)
                
            # Populate UI fields with the loaded configuration
            self.states_entry.delete(0, tk.END)
            self.states_entry.insert(0, ", ".join(config.get("states", [])))
            
            self.alphabet_entry.delete(0, tk.END)
            self.alphabet_entry.insert(0, ", ".join(config.get("alphabet", [])))
            
            self.stack_symbols_entry.delete(0, tk.END)
            self.stack_symbols_entry.insert(0, ", ".join(config.get("stack_symbols", [])))
            
            self.initial_state_entry.delete(0, tk.END)
            self.initial_state_entry.insert(0, config.get("initial_state", ""))
            
            self.initial_stack_symbol_entry.delete(0, tk.END)
            self.initial_stack_symbol_entry.insert(0, config.get("initial_stack_symbol", ""))
            
            self.accept_states_entry.delete(0, tk.END)
            self.accept_states_entry.insert(0, ", ".join(config.get("accept_states", [])))
            
            # Handle transitions
            self.transitions_text.delete("1.0", tk.END)
            transition_lines = []
            
            for transition in transitions:
                from_state = transition.get("from_state", "")
                input_symbol = transition.get("input_symbol", "")
                stack_symbol = transition.get("stack_symbol", "")
                to_state = transition.get("to_state", "")
                stack_push = transition.get("stack_push", "")
                
                # Normalize epsilon for display
                if input_symbol in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                    input_symbol = EPSILON
                if stack_push in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                    stack_push = EPSILON
                
                transition_line = f"{from_state},{input_symbol},{stack_symbol}→{to_state},{stack_push}"
                transition_lines.append(transition_line)
            
            self.transitions_text.insert("1.0", "\n".join(transition_lines))
            
            # Set input string if provided
            if "input_string" in config:
                self.input_string_entry.delete(0, tk.END)
                self.input_string_entry.insert(0, config.get("input_string", ""))
            
            # If any symbols were added, inform the user
            if added_symbols:
                self.update_status(f"PDA configuration loaded from {file_path}\nAdded missing stack symbols: {', '.join(added_symbols)}")
            else:
                self.update_status(f"PDA configuration loaded from {file_path}")
            
            # Automatically load the PDA
            self.load_pda()
            
        except Exception as e:
            messagebox.showerror("Error Loading JSON", str(e))
            self.update_status(f"Error loading JSON: {str(e)}")
    
    def save_to_json(self):
        """Save current PDA configuration to a JSON file"""
        try:
            # First ensure the PDA is correctly loaded from UI to capture any changes
            self.load_pda()
            
            # Create the configuration dictionary
            config = {
                "states": list(self.pda.states),
                "alphabet": [s for s in self.pda.alphabet if s != 'ε'],  # Exclude epsilon from alphabet
                "stack_symbols": list(self.pda.stack_symbols),
                "initial_state": self.pda.initial_state,
                "initial_stack_symbol": self.pda.initial_stack_symbol,
                "accept_states": list(self.pda.accept_states),
                "input_string": self.input_string_entry.get(),
                "transitions": []
            }
            
            # Format transitions
            for key, transitions in self.pda.transitions.items():
                state, input_symbol, stack_symbol = key
                
                for next_state, stack_push in transitions:
                    transition = {
                        "from_state": state,
                        "input_symbol": input_symbol,
                        "stack_symbol": stack_symbol,
                        "to_state": next_state,
                        "stack_push": stack_push
                    }
                    config["transitions"].append(transition)
            
            # Ask user for save location
            file_path = filedialog.asksaveasfilename(
                title="Save JSON Configuration",
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            
            if not file_path:
                return  # User cancelled the operation
            
            with open(file_path, 'w') as file:
                json.dump(config, file, indent=4)
            
            self.update_status(f"PDA configuration saved to {file_path}")
            
        except Exception as e:
            messagebox.showerror("Error Saving JSON", str(e))
            self.update_status(f"Error saving JSON: {str(e)}")
    
    def load_pda(self):
        """Parse and load PDA definition from UI entries"""
        try:
            self.pda = PDA()
            
            # Parse states
            self.pda.states = {s.strip() for s in self.states_entry.get().split(',')}
            
            # Parse alphabet
            self.pda.alphabet = {s.strip() for s in self.alphabet_entry.get().split(',')}
            self.pda.alphabet.add(EPSILON)  # Add epsilon for epsilon transitions
            
            # Parse stack symbols
            self.pda.stack_symbols = {s.strip() for s in self.stack_symbols_entry.get().split(',')}
            
            # Set initial state
            self.pda.initial_state = self.initial_state_entry.get().strip()
            if self.pda.initial_state not in self.pda.states:
                raise ValueError(f"Initial state '{self.pda.initial_state}' not in state set")
            
            # Set initial stack symbol
            self.pda.initial_stack_symbol = self.initial_stack_symbol_entry.get().strip()
            if self.pda.initial_stack_symbol not in self.pda.stack_symbols:
                raise ValueError(f"Initial stack symbol '{self.pda.initial_stack_symbol}' not in stack symbol set")
            
            # Parse accept states
            self.pda.accept_states = {s.strip() for s in self.accept_states_entry.get().split(',')}
            for state in self.pda.accept_states:
                if state not in self.pda.states:
                    raise ValueError(f"Accept state '{state}' not in state set")
            
            # Pre-validate transitions for missing stack symbols
            transition_text = self.transitions_text.get("1.0", tk.END).strip()
            missing_stack_symbols = set()
            
            for line in transition_text.split('\n'):
                if not line.strip():
                    continue
                
                # Expected format: "q0,a,Z→q0,AZ"
                match = re.match(r'([^,]+),([^,]+),([^→]+)→([^,]+),(.*)', line)
                if match:
                    _, input_symbol, _, _, stack_push = match.groups()
                    input_symbol = input_symbol.strip()
                    stack_push = stack_push.strip()
                    
                    # Normalize epsilon
                    if input_symbol in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                        input_symbol = EPSILON
                    
                    if stack_push in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                        stack_push = EPSILON
                    
                    if stack_push and stack_push != EPSILON:
                        for symbol in stack_push:
                            if symbol not in self.pda.stack_symbols:
                                missing_stack_symbols.add(symbol)
            
            # If there are missing stack symbols, ask the user if they want to add them
            if missing_stack_symbols:
                msg = f"The following stack symbols are used in transitions but not defined: {', '.join(missing_stack_symbols)}\n\nDo you want to add them to your stack symbols?"
                add_symbols = messagebox.askyesno("Missing Stack Symbols", msg)
                
                if add_symbols:
                    # Add the missing symbols to the stack symbols
                    self.pda.stack_symbols.update(missing_stack_symbols)
                    
                    # Update the stack symbols entry
                    self.stack_symbols_entry.delete(0, tk.END)
                    self.stack_symbols_entry.insert(0, ", ".join(self.pda.stack_symbols))
                    
                    self.update_status(f"Added missing stack symbols: {', '.join(missing_stack_symbols)}")
            
            # Now parse transitions
            for line in transition_text.split('\n'):
                if not line.strip():
                    continue
                
                # Expected format: "q0,a,Z→q0,AZ"
                match = re.match(r'([^,]+),([^,]+),([^→]+)→([^,]+),(.*)', line)
                if not match:
                    raise ValueError(f"Invalid transition format: {line}")
                
                state, input_symbol, stack_symbol, next_state, stack_push = match.groups()
                state = state.strip()
                input_symbol = input_symbol.strip()
                stack_symbol = stack_symbol.strip()
                next_state = next_state.strip()
                stack_push = stack_push.strip()
                
                # Normalize epsilon
                if input_symbol in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                    input_symbol = EPSILON
                
                if stack_push in ('ε', 'Îµ', 'Ïµ', 'ϵ', 'Îµ', ''):
                    stack_push = EPSILON
                
                if state not in self.pda.states:
                    raise ValueError(f"State '{state}' in transition not in state set")
                if next_state not in self.pda.states:
                    raise ValueError(f"Next state '{next_state}' in transition not in state set")
                if input_symbol != EPSILON and input_symbol not in self.pda.alphabet:
                    raise ValueError(f"Input symbol '{input_symbol}' in transition not in alphabet")
                if stack_symbol not in self.pda.stack_symbols:
                    raise ValueError(f"Stack symbol '{stack_symbol}' in transition not in stack symbol set")
                
                # Check stack push symbols
                if stack_push != EPSILON:  # ε means pop only
                    for symbol in stack_push:
                        if symbol not in self.pda.stack_symbols:
                            invalid_symbol = symbol
                            raise ValueError(f"Push symbol '{invalid_symbol}' in transition not in stack symbol set. Please add '{invalid_symbol}' to your stack symbols list.")
                
                self.pda.add_transition(state, input_symbol, stack_symbol, next_state, stack_push)
            
            self.update_status("PDA loaded successfully!")
            self.reset_visualization()
            
        except Exception as e:
            messagebox.showerror("Error Loading PDA", str(e))
            self.update_status(f"Error: {str(e)}")
    
    def reset_visualization(self):
        """Reset the visualization to initial state"""
        self.canvas.delete("all")
        self.traces_canvas.delete("all")
        self.current_configs = []
        self.all_traces = []
        self.current_step = 0
        self.is_running = False
        
        if hasattr(self, 'execution_thread') and self.execution_thread is not None:
            self.execution_thread = None
        
        self.run_button.config(state=tk.NORMAL)
        self.pause_button.config(state=tk.DISABLED)
        self.step_button.config(state=tk.NORMAL)
        
        # Initialize with the start configuration if PDA is loaded
        if hasattr(self.pda, 'initial_state') and self.pda.initial_state:
            input_string = self.input_string_entry.get()
            initial_config = Configuration(
                self.pda.initial_state,
                input_string,
                self.pda.initial_stack_symbol,
                None,
                None
            )
            self.current_configs = [initial_config]
            self.draw_stack(initial_config)
            self.update_status(f"Ready to execute input: {input_string}")
    
    def update_speed(self, value):
        """Update animation speed based on slider"""
        self.animation_speed = float(value)
    
    def update_status(self, message):
        """Update the status text area"""
        self.status_text.config(state=tk.NORMAL)
        self.status_text.delete("1.0", tk.END)
        self.status_text.insert("1.0", message)
        self.status_text.config(state=tk.DISABLED)
    
    def run_simulation(self):
        """Run the simulation from the current point to completion"""
        if not self.current_configs:
            self.reset_visualization()
            if not self.current_configs:
                messagebox.showinfo("Error", "Please load a PDA configuration first")
                return
        
        self.is_running = True
        self.run_button.config(state=tk.DISABLED)
        self.pause_button.config(state=tk.NORMAL)
        self.step_button.config(state=tk.DISABLED)
        
        # Run in a separate thread to not block the UI
        self.execution_thread = threading.Thread(target=self.run_simulation_thread)
        self.execution_thread.daemon = True
        self.execution_thread.start()
    
    def run_simulation_thread(self):
        """Thread for running the simulation"""
        try:
            while self.is_running and self.current_configs:
                all_done = True
                
                for config in self.current_configs:
                    if config.remaining_input or self.can_take_epsilon_transition(config):
                        all_done = False
                        break
                
                if all_done:
                    break
                
                self.step_simulation()
                time.sleep(self.animation_speed)
            
            if not self.current_configs:
                self.after(0, lambda: self.update_status("No valid configurations remain. String rejected."))
            else:
                accepted = any(config.state in self.pda.accept_states for config in self.current_configs)
                if accepted:
                    self.after(0, lambda: self.update_status("String accepted! In an accept state."))
                else:
                    self.after(0, lambda: self.update_status("String processed but not accepted. Not in an accept state."))
        except Exception as e:
            self.after(0, lambda: self.update_status(f"Error in simulation: {str(e)}"))
        
        self.is_running = False
        self.after(0, lambda: self.pause_button.config(state=tk.DISABLED))
        self.after(0, lambda: self.run_button.config(state=tk.NORMAL))
        self.after(0, lambda: self.step_button.config(state=tk.NORMAL))
    
    def can_take_epsilon_transition(self, config):
        """Check if the configuration can take an epsilon transition"""
        if not config.stack:
            return False
        
        stack_top = config.stack[0]
        return (config.state, EPSILON, stack_top) in self.pda.transitions
    
    def pause_simulation(self):
        """Pause the running simulation"""
        self.is_running = False
        self.pause_button.config(state=tk.DISABLED)
        self.run_button.config(state=tk.NORMAL)
        self.step_button.config(state=tk.NORMAL)
    
    def step_simulation(self):
        """Advance the simulation by one step"""
        if not self.current_configs:
            self.reset_visualization()
            if not self.current_configs:
                messagebox.showinfo("Error", "Please load a PDA configuration first")
                return
        
        new_configs = []
        
        for config in self.current_configs:
            # If stack is empty, can't transition
            if not config.stack:
                continue
            
            stack_top = config.stack[0]
            transitions_taken = False
            
            # First try regular input transitions if there are remaining inputs
            if config.remaining_input:
                current_input = config.remaining_input[0]
                remaining = config.remaining_input[1:]
                
                # Check transitions for the current input
                for next_state, stack_push in self.pda.get_transitions(config.state, current_input, stack_top):
                    transitions_taken = True
                    new_stack = self.update_stack(config.stack, stack_push)
                    transition_info = f"{config.state}, {current_input}, {stack_top} → {next_state}, {stack_push or EPSILON}"
                    
                    new_config = Configuration(
                        next_state,
                        remaining,
                        new_stack,
                        config,
                        transition_info
                    )
                    new_configs.append(new_config)
            
            # If no regular transitions or we can take epsilon transitions
            epsilon_transitions = self.pda.get_transitions(config.state, EPSILON, stack_top)
            for next_state, stack_push in epsilon_transitions:
                transitions_taken = True
                new_stack = self.update_stack(config.stack, stack_push)
                transition_info = f"{config.state}, {EPSILON}, {stack_top} → {next_state}, {stack_push or EPSILON}"
                
                new_config = Configuration(
                    next_state,
                    config.remaining_input,
                    new_stack,
                    config,
                    transition_info
                )
                new_configs.append(new_config)
            
            # If no transitions taken and there's no input left
            if not transitions_taken and not config.remaining_input:
                new_configs.append(config)  # Keep this config as is
        
        # Update current configurations
        self.current_configs = new_configs
        self.current_step += 1
        
        # Update the visualization
        self.canvas.delete("all")
        self.traces_canvas.delete("all")
        
        self.all_traces.extend(self.current_configs)
        
        # Visualize all currently active configs
        if self.current_configs:
            # Show the first configuration's stack in detail
            self.draw_stack(self.current_configs[0])
            
            # Draw all traces in the traces canvas
            self.draw_traces()
            
            # Update status with number of active configurations
            status_message = f"Step {self.current_step}: {len(self.current_configs)} active configuration(s)"
            
            if len(self.current_configs) > 0:
                config = self.current_configs[0]
                status_message += f"\nCurrent State: {config.state}"
                status_message += f"\nRemaining Input: {config.remaining_input or EPSILON}"
                status_message += f"\nStack: {config.stack or 'empty'}"
                
                if config.transition_taken:
                    status_message += f"\nTransition: {config.transition_taken}"
            
            self.update_status(status_message)
        else:
            self.update_status(f"Step {self.current_step}: No valid configurations remain. String rejected.")
    
    def update_stack(self, stack, stack_push):
        """Update the stack based on the transition"""
        # Pop the top symbol
        new_stack = stack[1:] if stack else ""
        
        # Push new symbols (if any)
        if stack_push and stack_push != EPSILON:
            new_stack = stack_push + new_stack
            
        return new_stack
    
    def draw_stack(self, config):
        """Draw the stack for a single configuration"""
        if not config or not hasattr(config, 'stack'):
            return
        
        stack = config.stack
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()
        
        # Ensure we have dimensions even on first run
        if canvas_width < 10:
            canvas_width = 300
        if canvas_height < 10:
            canvas_height = 400
        
        # Clear canvas
        self.canvas.delete("all")
        
        # Draw stack title and state info
        self.canvas.create_text(
            canvas_width // 2, 
            20, 
            text=f"State: {config.state} | Input: {config.remaining_input or EPSILON}", 
            font=("Arial", 12, "bold")
        )
        
        # Draw the stack
        stack_width = 100
        element_height = 40
        
        # Position the stack in the center of the canvas
        stack_x = canvas_width // 2 - stack_width // 2
        
        # Draw bottom of stack
        self.canvas.create_rectangle(
            stack_x, 
            canvas_height - 30, 
            stack_x + stack_width, 
            canvas_height - 10,
            fill="lightgray", 
            outline="black"
        )
        
        # Draw stack elements from bottom to top
        if stack:
            max_visible = min(10, len(stack))  # Limit number of visible elements
            
            for i in range(max_visible):
                y_pos = canvas_height - 30 - (i + 1) * element_height
                
                self.canvas.create_rectangle(
                    stack_x, 
                    y_pos, 
                    stack_x + stack_width, 
                    y_pos + element_height,
                    fill="lightblue" if i == 0 else "white", 
                    outline="black"
                )
                
                self.canvas.create_text(
                    stack_x + stack_width // 2,
                    y_pos + element_height // 2,
                    text=stack[i],
                    font=("Arial", 14, "bold")
                )
            
            # If there are more elements than we can show
            if len(stack) > max_visible:
                self.canvas.create_text(
                    stack_x + stack_width // 2,
                    canvas_height - 30 - (max_visible + 1) * element_height,
                    text=f"... {len(stack) - max_visible} more",
                    font=("Arial", 10)
                )
        else:
            # Empty stack message
            self.canvas.create_text(
                stack_x + stack_width // 2,
                canvas_height - 60,
                text="Empty Stack",
                font=("Arial", 10, "italic")
            )
            
        # Draw state information
        if config.transition_taken:
            self.canvas.create_text(
                canvas_width // 2,
                50,
                text=f"Transition: {config.transition_taken}",
                font=("Arial", 10),
                fill="blue"
            )
            
        # Draw accept/reject status
        if not config.remaining_input:
            status_text = "ACCEPT" if config.state in self.pda.accept_states else "Not Accepted"
            status_color = "green" if config.state in self.pda.accept_states else "red"
            
            self.canvas.create_text(
                canvas_width // 2,
                80,
                text=status_text,
                font=("Arial", 12, "bold"),
                fill=status_color
            )
    
    def draw_traces(self):
        """Draw all active execution traces in the traces canvas"""
        canvas_width = self.traces_canvas.winfo_width()
        canvas_height = self.traces_canvas.winfo_height()
        
        # Ensure we have dimensions even on first run
        if canvas_width < 10:
            canvas_width = 600
        if canvas_height < 10:
            canvas_height = 150
            
        # Number of active configurations
        num_configs = len(self.current_configs)
        if num_configs == 0:
            self.traces_canvas.create_text(
                canvas_width // 2, 
                canvas_height // 2, 
                text="No active configurations",
                font=("Arial", 10, "italic")
            )
            return
        
        # Calculate spacing
        trace_width = min(150, canvas_width // num_configs)
        spacing = min(20, (canvas_width - num_configs * trace_width) // (num_configs + 1))
        
        # Draw each active configuration's trace
        for i, config in enumerate(self.current_configs):
            x_pos = spacing + i * (trace_width + spacing)
            
            # Draw a box for this trace
            self.traces_canvas.create_rectangle(
                x_pos, 
                10, 
                x_pos + trace_width, 
                canvas_height - 10,
                fill="lightyellow", 
                outline="black"
            )
            
            # Draw trace number
            self.traces_canvas.create_text(
                x_pos + trace_width // 2, 
                20, 
                text=f"Trace {i+1}",
                font=("Arial", 8, "bold")
            )
            
            # Draw state
            self.traces_canvas.create_text(
                x_pos + trace_width // 2, 
                40, 
                text=f"State: {config.state}",
                font=("Arial", 8)
            )
            
            # Draw simplified stack representation
            stack_text = config.stack[:3] + "..." if len(config.stack) > 3 else config.stack or EPSILON
            self.traces_canvas.create_text(
                x_pos + trace_width // 2, 
                60, 
                text=f"Stack: {stack_text}",
                font=("Arial", 8)
            )
            
            # Draw remaining input (simplified)
            input_text = config.remaining_input[:3] + "..." if len(config.remaining_input) > 3 else config.remaining_input or EPSILON
            self.traces_canvas.create_text(
                x_pos + trace_width // 2, 
                80, 
                text=f"Input: {input_text}",
                font=("Arial", 8)
            )
            
            # Draw accept/reject status
            if not config.remaining_input:
                status_text = "ACCEPT" if config.state in self.pda.accept_states else "REJECT"
                status_color = "green" if config.state in self.pda.accept_states else "red"
                
                self.traces_canvas.create_text(
                    x_pos + trace_width // 2, 
                    100, 
                    text=status_text,
                    font=("Arial", 8, "bold"),
                    fill=status_color
                )

if __name__ == "__main__":
    app = StackVisualizer()
    app.mainloop()