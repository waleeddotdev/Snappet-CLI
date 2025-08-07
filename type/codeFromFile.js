import inquirer from "inquirer";
import fs from 'fs/promises';
import process from 'process';
import chalk from 'chalk';

export const CodeFromFile = async () => {
    const questions = [
        {
            type: 'input',
            name: 'fileLocation',
            message: 'Enter the path to the file for which you want to generate a screenshot:',
            validate: (input) => {
                if (!input || input.trim() === '') {
                    return 'File path cannot be empty.';
                }
                return true;
            }
        }
    ];

    const answers = await inquirer.prompt(questions);
    let fileLocation = answers.fileLocation;

    fileLocation = fileLocation.trim();

    if (fileLocation.startsWith('& ')) {
        fileLocation = fileLocation.substring(2);
        fileLocation = fileLocation.trim();
    }
    if (fileLocation.startsWith("'") && fileLocation.endsWith("'")) {
        fileLocation = fileLocation.substring(1, fileLocation.length - 1);
        fileLocation = fileLocation.trim();
    }

    if (fileLocation.startsWith('"') && fileLocation.endsWith('"')) {
        fileLocation = fileLocation.substring(1, fileLocation.length - 1);
        fileLocation = fileLocation.trim();
    }

    if (!fileLocation) {
        console.error(chalk.red("Error: File location was not provided or was invalid after cleaning. Exiting."));
        process.exit(1);
    }


    try {
        const fileContent = await fs.readFile(fileLocation, 'utf8');
        const fileExtension = fileLocation.split('.').pop();
        const fileName = fileLocation.split(/[/\\]/).pop();

        return { fileContent, fileExtension, fileName };
    } catch (error) {
        // Improved error handling
        if (error.code === 'ENOENT') {
            console.error(chalk.red(`Error: The file was not found at the specified path:`));
            console.error(chalk.red(fileLocation));
            console.error(chalk.red("Please ensure the path is correct and the file exists."));
            console.error(chalk.red("Note: Paths with spaces might need to be enclosed in quotes, but the tool attempts to handle common formatting from copy-paste or drag-drop."));

        } else if (error.code === 'EACCES') {
            console.error(chalk.red(`Error: Permission denied to read the file:`));
            console.error(chalk.red(fileLocation));
            console.error(chalk.red("Please check your file permissions."));
        }
        else {
            console.error(chalk.red(`An unexpected error occurred while reading the file at ${fileLocation}:`));
            console.error(chalk.red(error.message));
        }
        process.exit(1);
    }
};