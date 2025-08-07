import inquirer from 'inquirer';
import { CodeFromFile } from './type/codeFromFile.js';
import { CommandOutput } from './type/commandOutput.js';
import chalk from 'chalk';
import chalkAnimation from "chalk-animation";
import gradient from 'gradient-string';
import figlet from 'figlet';
import clipboard from 'clipboardy';
import puppeteer from 'puppeteer';
export const generateImageUsingCli = async () => {

    const promptUserForScreenshotType = async () => {
        const questions = [
            {
                type: 'list',
                name: 'screenshotType',
                message: 'What would you like to generate a screenshot of?',
                choices: [
                    'Code from a file',
                    'Output of a command',
                    'Custom code',
                    'Quit/Exit'
                ]
            }
        ];

        const answers = await inquirer.prompt(questions);
        return answers.screenshotType;
    };

    const screenshotType = await promptUserForScreenshotType();

    let text = null;
    let extension = null;
    let fileName = null;

    if (screenshotType === 'Code from a file') {
        const result = await CodeFromFile();
        text = result.fileContent;
        extension = result.fileExtension;
        fileName = result.fileName;
    } else if (screenshotType === 'Output of a command') {
        // Output of a command
        const result = await CommandOutput();
        text = result.output;
        console.log(result);

    } else if (screenshotType === 'Custom code') {
        // Custom code
    } else if (screenshotType === 'Quit/Exit') {
        console.log(
            chalk.bold(gradient.morning(figlet.textSync('Goodbye!'))),
        );
        process.exit(0);
    }

    if (text) {
        clipboard.writeSync(text);
        await launchAutoBroswer(extension, fileName);
        console.log(
            chalk.bold(gradient.morning(figlet.textSync('Happy Editing!'))),
        );
    }

}

const launchAutoBroswer = async (extension, fileName) => {

    let browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'], defaultViewport: null });

    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/?source=cli&extension=${extension}&fileName=${fileName}`, { waitUntil: 'domcontentloaded' });
}