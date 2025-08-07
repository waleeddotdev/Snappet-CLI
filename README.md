# Snappet-CLI 📸

A simple command-line tool to quickly generate beautiful screenshots of your code using the power of [snappet.io](https://snappetio.netlify.app).

![Snappet-CLI Demo](https://github.com/waleeddotdev/Snappet-CLI/blob/main/cover.png)

## What it Does

This tool automates the process of creating a beautiful image of a code file without leaving your terminal. It reads your file, opens snappet.io in a headless browser, generates the image, and saves it directly to your system.

## Getting Started

Since this package is not yet published on npm, you can run it locally by following these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/snappet-cli.git
    ```

2.  **Navigate into the project directory:**
    ```bash
    cd snappet-cli
    ```

3.  **Install the dependencies:**
    ```bash
    npm install
    ```

## Commands

To see all available commands and options, run the tool with the `--help` or `-h` flag:

```bash
node index.js --help
```

## Tech Stack
- Node.js: For the core command-line environment.
- Puppeteer: To control a headless Chrome browser for automation.
