#!/usr/bin/env node

'use strict';

const elv = require('elv');
const glob = require('glob');
const path = require('path');
const { spawn } = require('child_process');


//
// CONSTANTS
//


const runnerPath = path.join(__dirname, '_kesselrun.js');

const FAILED_MSG = '\u001b[31mFailed thresholds encountered\u001b[0m\n';
const SUCCESS_MSG = '\u001b[32mYou completed the Kessel Run in less than 12 parsecs!\u001b[0m\n';
const EXIT_EVENT = 'exit';
const NODE_PROC = 'node';
const SIGINT = 'SIGINT';
const SIGTERM = 'SIGTERM';
const STDIO_INHERIT = 'inherit';
const FAILED_THRESHOLD = 3;


//
// LAUNCH RUNNERS
//


function run(files) {
  const len = files.length;
  let complete = 0;
  let failedThreshold = false;

  files.forEach((file) => {
    const fullPath = path.join(process.cwd(), file);
    const proc = spawn(
      NODE_PROC,
      [runnerPath, fullPath],
      { stdio: STDIO_INHERIT }
    );

    proc.on(EXIT_EVENT, (code, signal) => {
      process.on(EXIT_EVENT, () => {
        complete++;
        if (signal) {
          process.kill(process.pid, signal);
        } else {
          if (code === FAILED_THRESHOLD) failedThreshold = true;

          if (complete === len) {
            if (failedThreshold) {
              console.log(FAILED_MSG);
              process.exit(FAILED_THRESHOLD);
            }

            console.log(SUCCESS_MSG);
          }
        }
      });
    });

    process.on(SIGINT, () => {
      proc.kill(SIGINT);
      proc.kill(SIGTERM);
    });
  });
}


//
// LOAD FILES
//


function loadFiles(args) {
  glob(args.location, (err, files) => {
    if (elv(err)) throw err;
    run(files);
  });
}


//
// PARSE ARGS AND GO
//


function parseArgs(args) {
  if (args.length < 3) {
    console.log('No file pattern was specified');
    process.exit(2);
  }

  if (args.length > 3) {
    console.log(`Unknown argument encountered: ${args[3]}`);
    process.exit(2);
  }

  loadFiles({
    location: args[2],
  });
}


(function doit() {
  parseArgs(process.argv);
}());
