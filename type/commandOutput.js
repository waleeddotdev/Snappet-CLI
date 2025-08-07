import childProcess from 'child_process';
import inquirer from 'inquirer';
import readline from 'readline'; // Import the readline module

export const CommandOutput = async () => {

    const questions = [
        {
            type: 'input',
            name: 'command',
            message: 'Enter the command (or interactive script) to run:',
            validate: (input) => {
                if (!input || input.trim() === '') {
                    return 'Command cannot be empty.';
                }
                return true;
            }
        }
    ];

    const answers = await inquirer.prompt(questions);
    let command = answers.command.trim();

    console.log(`\n--- Running Command: "${command}" ---`);
    console.log("Interact with the command below. Your input will be captured.");
    console.log(`--------------------------------------\n`);

    // Create a readline interface to handle user input line by line
    // We use process.stdin for input and process.stdout for output,
    // but we will also manually write child output to process.stdout.
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout, // We still need this for readline's own prompts/handling if any, though we'll mostly write directly
        terminal: true // Ensure it behaves like a TTY for line editing etc.
    });

    return new Promise((resolve, reject) => {
        // Use stdio: ['pipe', 'pipe', 'pipe']
        // pipe: Connect child stdin to a pipe we control
        // pipe: Connect child stdout to a pipe we control
        // pipe: Connect child stderr to a pipe we control
        const commandProcess = childProcess.spawn(command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });

        let output = ''; // Buffer to store both child output and user input

        // Flag to prevent writing to child stdin after it's closed
        let stdinClosed = false;

        // --- Handle Child Process Output (stdout and stderr) ---

        commandProcess.stdout.on('data', (data) => {
            const dataString = data.toString();
            output += dataString;         // Append to our output buffer
            // Write to the parent's stdout so the user sees the child's output (e.g., prompts)
            // We need to be careful not to interfere with readline's current line display.
            // A simple approach is to write directly. rl.write(dataString) is another option
            // if you want readline to manage cursor positioning, but it's complex.
            process.stdout.write(dataString);
        });

        commandProcess.stderr.on('data', (data) => {
            const dataString = data.toString();
            output += dataString; // Often useful to include stderr in the capture
            // Write to the parent's stderr so the user sees errors
            process.stderr.write(dataString);
        });

        // --- Handle User Input (process.stdin via readline) ---

        // Listen for lines entered by the user
        rl.on('line', (line) => {
            // Append user's typed line PLUS a newline to our captured output
            // Readline strips the newline, so we add it back to match terminal behavior
            output += line + '\n';

            // Write the line PLUS a newline to the child process's stdin pipe
            if (!stdinClosed) {
                // Write directly to the child's stdin pipe
                commandProcess.stdin.write(line + '\n');
            }
            // readline automatically echoes the line the user typed.
        });

        // Handle Ctrl+C from the user
        rl.on('SIGINT', () => {
            console.log('\n--- Command Interrupted by User (Ctrl+C) ---');
            output += '\n--- Command Interrupted by User (Ctrl+C) ---\n'; // Capture the interruption
            // Kill the child process
            if (!commandProcess.killed) {
                commandProcess.kill('SIGINT'); // Send SIGINT signal to child
            }
            // Close readline interface gracefully
            rl.close();
            // Reject the promise indicating interruption
            reject(new Error('Command interrupted by user (Ctrl+C)'));
        });


        // --- Handle Child Process Events ---

        // Handle errors during process spawning (e.g., command not found)
        commandProcess.on('error', (err) => {
            console.error(`Failed to start command "${command}":`, err);
            output += `Failed to start command "${command}": ${err.message}\n`; // Capture error
            // Close readline interface
            rl.close();
            // Reject the promise
            reject(err);
        });

        // Handle the child process exiting
        commandProcess.on('close', (code) => {

            console.log(`\n--------------------------------------`);
            // Close readline interface
            rl.close();

            // Resolve or reject the main promise
            if (code !== 0) {
                // Optionally include the captured output in the reject reason
                const error = new Error(`Command "${command}" exited with code ${code}`);
                // Attach the full captured output to the error object
                error.capturedOutput = output;
                reject(error);
            } else {
                resolve({ output, input: command }); // Resolve with the final captured output and the command
            }
        });

        // Handle the child's stdin pipe closing (e.g., child process exits)
        commandProcess.stdin.on('close', () => {
            stdinClosed = true;
            // console.log('Child stdin pipe closed.'); // For debugging
        });

        // Handle errors on the child's stdin pipe (e.g., writing after it closed)
        commandProcess.stdin.on('error', (err) => {
            // This might happen if we try to write after the child process has closed its stdin or exited
            console.error('Error on child stdin:', err.message);
            output += `\nError writing to child stdin: ${err.message}\n`; // Capture error
            // We don't necessarily reject the main promise here, the 'close' event
            // of the main process will handle the final state.
        });

    });
};

// Example usage (you would typically call this function elsewhere)
/*
(async () => {
    try {
        const result = await CommandOutput();
        console.log('\n--- Final Captured Output (Including your input) ---');
        console.log(result.output);
        console.log('----------------------------------------------------');
    } catch (error) {
        console.error('\n--- An error occurred (and captured output if available) ---');
        if (error.capturedOutput) {
             console.error('Captured Output:\n', error.capturedOutput);
        } else {
             console.error(error.message);
             console.error(error);
        }
        console.error('----------------------------------------------------------');
    }
})();
*/