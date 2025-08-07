#!/usr/bin/env node

import chalk from "chalk";
import chalkAnimation from "chalk-animation"; // Although not used in the latest welcome snippet, keep it as it was there
import figlet from "figlet";
import gradient from "gradient-string";
import inquirer from "inquirer";
import process from 'process'; // Import process for argv and exit
import fs from 'fs/promises'; // For reading files asynchronously
import { exec } from 'child_process'; // For executing commands

import { generateImageUsingCli } from "./generateImageUsingCli.js"; // Your interactive function

const args = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
    const figletText = chalk.bold(gradient.morning(figlet.textSync("Snappet.io")));
    console.log(figletText);
    await sleep(1000);
    console.log(chalk.italic.bold(gradient.morning("\nWelcome to the Snappet.io CLI!")));
    console.log(chalk.bold.italic(gradient.morning("Made by Waleed Nasir\n")));
}

function showHelp() {
    console.log(chalk.cyan("Usage: snappetio-cli [options]"));
    console.log(chalk.cyan("\nOptions:"));
    console.log(chalk.green("  -f <file_path>     ") + chalk.white("Generate screenshot from code in a file."));
    console.log(chalk.green("  -o <command>       ") + chalk.white("Generate screenshot from the output of a command."));
    console.log(chalk.green("  -c \"<custom_text>\" ") + chalk.white("Generate screenshot from custom text (enclose in quotes)."));
    console.log(chalk.green("  --help             ") + chalk.white("Show this help message and exit."));
    console.log(chalk.cyan("\nIf no options are provided, the tool will launch in interactive mode."));
}

async function readFileContent(filePath) {
    try {
        // Clean up the path - robustly handle quotes and leading shell artifacts
        let cleanedPath = filePath.trim();
        if (cleanedPath.startsWith("'") && cleanedPath.endsWith("'")) {
            cleanedPath = cleanedPath.substring(1, cleanedPath.length - 1).trim();
        }
        if (cleanedPath.startsWith('"') && cleanedPath.endsWith('"')) {
            cleanedPath = cleanedPath.substring(1, cleanedPath.length - 1).trim();
        }
        if (cleanedPath.startsWith('& ')) { // Handle common PowerShell drag/drop
            cleanedPath = cleanedPath.substring(2).trim();
        }


        console.log(chalk.yellow(`Reading file: ${cleanedPath}`));
        const content = await fs.readFile(cleanedPath, 'utf8');
        return content;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(chalk.red(`Error: File not found at ${filePath}`));
        } else if (error.code === 'EACCES') {
            console.error(chalk.red(`Error: Permission denied to read file at ${filePath}`));
        }
        else {
            console.error(chalk.red(`Error reading file ${filePath}: ${error.message}`));
        }
        process.exit(1); // Exit on file error
    }
}

async function executeCommand(command) {
    console.log(chalk.yellow(`Executing command: ${command}`));
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(chalk.red(`Error executing command "${command}": ${error.message}`));
                // Include stderr if available, sometimes errors go there
                if (stderr) {
                    console.error(chalk.red(`Command stderr: ${stderr}`));
                }
                reject(error);
            } else {
                // Resolve with stdout, command output is usually stdout
                if (stderr) {
                    console.warn(chalk.yellow(`Command had stderr output (likely warnings):\n${stderr}`));
                }
                resolve(stdout);
            }
        });
    }).catch(() => {
        process.exit(1); // Exit on command execution error
    });
}


async function main() {
    await welcome();

    if (args.includes('--help')) {
        showHelp();
        process.exit(0); // Exit after showing help
    }

    let contentType = null;
    let contentValue = null;

    // Basic flag parsing - assumes only one content source flag is used
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '-f') {
            if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
                console.error(chalk.red("Error: -f flag requires a file path."));
                showHelp();
                process.exit(1);
            }
            contentType = 'file';
            contentValue = args[i + 1];
            break; // Stop processing flags once a content type is found
        } else if (arg === '-o') {
            if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
                console.error(chalk.red("Error: -o flag requires a command string."));
                showHelp();
                process.exit(1);
            }
            contentType = 'command';
            contentValue = args.slice(i + 1).join(' '); // Join all remaining args with spaces as the command
            break;
            break;
        } else if (arg === '-c') {
            // -c value can potentially be the last argument
            if (i + 1 >= args.length) {
                console.error(chalk.red("Error: -c flag requires custom text."));
                showHelp();
                process.exit(1);
            }
            contentType = 'custom';
            // Take the next argument as the text. process.argv handles quoted strings.
            contentValue = args[i + 1];
            break;
        }
        // Add a check for unrecognized args if desired, though maybe not necessary for simple CLI
        // else if (!arg.startsWith('-')) {
        //     // This might be a positional argument we don't handle, or misplaced value
        //     console.warn(chalk.yellow(`Warning: Unrecognized argument or value: ${arg}`));
        // }
    }

    let textContent = null; // This variable will hold the final text for screenshot

    if (contentType === 'file') {
        textContent = await readFileContent(contentValue);
    } else if (contentType === 'command') {
        textContent = await executeCommand(contentValue);
    } else if (contentType === 'custom') {
        textContent = contentValue;
    } else if (args.length === 0) {
        // No flags provided, run interactive mode
        await generateImageUsingCli();
        return; // Exit main after interactive mode finishes
    } else {
        // Args were provided, but none of the recognized flags (-f, -o, -c) were found
        console.error(chalk.red("Error: Unrecognized arguments or incorrect usage."));
        showHelp();
        process.exit(1);
    }

    // --- At this point, textContent should hold the content from file, command, or custom text ---
    // This is where you would use textContent to generate the image/URL
    // For now, as requested, just console.log the obtained content for non-interactive modes

    if (textContent !== null) {
        console.log(chalk.green("\n--- Obtained Content for Screenshot ---"));
        console.log(textContent);
        console.log(chalk.green("--- End of Obtained Content ---\n"));

        // TODO: Add the logic here to take `textContent`, generate the URL
        // (potentially shorten it as discussed before), and open the browser
        // or save the image, etc.
        // This logic is specific to your app's next step after getting the text.

    } else {
        // This case should ideally not be reached if exit(1) happens on errors,
        // but as a fallback:
        console.error(chalk.red("Error: Could not obtain content based on provided options."));
        process.exit(1);
    }


}

main();