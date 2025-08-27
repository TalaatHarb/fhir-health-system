@echo off
REM Batch file wrapper for running tests in watch mode
REM Usage: run-tests-watch.bat [test-file-pattern]

if "%1"=="" (
    echo Running all tests in watch mode...
    node node_modules\vitest\dist\cli.js
) else (
    echo Running tests in watch mode for: %1
    node node_modules\vitest\dist\cli.js %*
)